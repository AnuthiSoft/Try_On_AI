# Virtual_try_on.py

import os
import base64
import requests
from io import BytesIO
from typing import List, Any, Dict
from datetime import datetime
from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    Depends,
    BackgroundTasks,
)
from PIL import Image, ImageDraw, ImageOps
from dotenv import load_dotenv

from roles import get_current_user
from db import image_type_selection_coll
from services.wallet_service import deduct_credits, add_credits

from virtual_tryon_db_connection import (
    save_job_document,
    job_name_exists_for_user,
    update_job_status,
)

from azure_blob_storage import (
    upload_cloth_image_to_blob,
    upload_generated_image_to_blob,
)

# ==================================================
# ENV
# ==================================================
load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("GPT_AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("GPT_AZURE_OPENAI_KEY")
DEPLOYMENT_NAME = os.getenv("GPT_DEPLOYMENT_NAME")
API_VERSION = os.getenv("GPT_API_VERSION", "2025-04-01-preview")

router = APIRouter(prefix="/virtual-tryon", tags=["Virtual Try-On"])

# ==================================================
# PROMPT
# ==================================================
PERMANENT_TRYON_PROMPT = (
    "You are performing a virtual clothing try-on.\n\n"
    "CRITICAL RULES:\n"
    "- Face, head, hair, skin tone, and identity must remain IDENTICAL.\n"
    "- Clothing must be applied ONLY below the neck.\n"
    "- Do not modify facial features.\n\n"
    "IMAGE 1 is the PERSON.\n"
    "IMAGE 2 is the CLOTHING.\n"
)

# ==================================================
# HELPERS
# ==================================================
def normalize_job_name(name: str) -> str:
    return name.strip().replace(" ", "_").lower()

def normalize_filename(filename: str) -> str:
    return Path(filename).stem.lower().replace(" ", "_")

def extract_user_id(user: Any) -> str:
    return str(user.get("_id")) if isinstance(user, dict) else str(user._id)

def map_quality_for_azure(quality: str) -> str:
    return {"basic": "low", "standard": "medium", "premium": "high"}[quality]

def normalize_exif(person_bytes: bytes) -> bytes:
    img = Image.open(BytesIO(person_bytes))
    img = ImageOps.exif_transpose(img)  # 🔥 APPLY EXIF ROTATION
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()

def enforce_db_size(image_bytes: bytes, target_size: str) -> bytes:
    target_w, target_h = map(int, target_size.split("x"))

    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    ow, oh = img.size

    scale = min(target_w / ow, target_h / oh)
    nw, nh = int(ow * scale), int(oh * scale)

    resized = img.resize((nw, nh), Image.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    canvas.paste(resized, ((target_w - nw) // 2, (target_h - nh) // 2))

    buf = BytesIO()
    canvas.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()



# ==================================================
# FACE LOCK (LOCAL – NON SQUARE SAFE)
# ==================================================
def apply_face_lock_locally(person_bytes: bytes) -> bytes:
    img = Image.open(BytesIO(person_bytes)).convert("RGB")
    w, h = img.size

    mask = Image.new("L", (w, h), 255)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([(0, 0), (w, int(h * 0.18))], fill=0)

    protected = Image.composite(img, img, mask)

    buf = BytesIO()
    protected.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()

# ==================================================
# AZURE TRY-ON (HYBRID MASK LOGIC)
# ==================================================
def call_azure_virtual_tryon(
    person_bytes: bytes,
    cloth_bytes: bytes,
    quality: str,
) -> bytes:

    url = (
        f"{AZURE_OPENAI_ENDPOINT}"
        f"/openai/deployments/{DEPLOYMENT_NAME}/images/edits"
        f"?api-version={API_VERSION}"
    )

    headers = {"api-key": AZURE_OPENAI_KEY}

    data = {
        "prompt": PERMANENT_TRYON_PROMPT,
        "n": 1,
        "quality": map_quality_for_azure(quality),
        "output_format": "png",
    }

    person_img = Image.open(BytesIO(person_bytes)).convert("RGB")
    w, h = person_img.size

    # ===== Person buffer
    person_buf = BytesIO()
    person_img.save(person_buf, format="PNG")
    person_buf.seek(0)

    cloth_buf = BytesIO(cloth_bytes)
    cloth_buf.seek(0)

    files = [
        ("image[]", ("person.png", person_buf, "image/png")),
        ("image[]", ("cloth.png", cloth_buf, "image/png")),
    ]

    # ✅ Use Azure mask ONLY for square images
    if w == h:
        mask = Image.new("L", (w, h), 255)
        draw = ImageDraw.Draw(mask)
        draw.rectangle([(0, 0), (w, int(h * 0.18))], fill=0)

        mask_buf = BytesIO()
        mask.save(mask_buf, format="PNG")
        mask_buf.seek(0)

        files.append(("mask", ("mask.png", mask_buf, "image/png")))

    resp = requests.post(
        url,
        headers=headers,
        data=data,
        files=files,
        timeout=180,
    )

    if resp.status_code != 200:
        raise RuntimeError(resp.text)

    return base64.b64decode(resp.json()["data"][0]["b64_json"])

# ==================================================
# BACKGROUND JOB
# ==================================================
def run_virtual_tryon_job(
    job_id: str,
    user_id: str,
    job_name: str,
    cloth_items: List[Dict],
    person_items: List[Dict],
    quality: str,
    size: str,
):
    try:
        result_map = {}

        for cloth in cloth_items:
            cname = cloth["cloth_name"]
            result_map[cname] = {
                "cloth_image_url": cloth["cloth_url"],
                "generated_urls": [],
            }

            for person in person_items:

                person_bytes = normalize_exif(person["bytes"])

                # ✅ Apply local face lock ONLY if non-square
                img = Image.open(BytesIO(person_bytes))
                expected_w, expected_h = map(int, size.split("x"))

                if img.width != expected_w or img.height != expected_h:
                    raise RuntimeError(
                        f"Size mismatch before Azure call: "
                        f"{img.width}x{img.height} != {size}"
                    )


                raw = call_azure_virtual_tryon(
                    person_bytes,
                    cloth["bytes"],
                    quality,
                )

                final = enforce_db_size(raw, size)

                url = upload_generated_image_to_blob(
                    image_bytes=final,
                    user_id=user_id,
                    job_name=job_name,
                    cloth_name=cname,
                    model_name=person["model_name"],
                )

                result_map[cname]["generated_urls"].append(url)

        update_job_status(job_id, "success", result_map)

    except Exception as e:
        price = image_type_selection_coll.find_one(
            {"user_id": user_id}
        )["tryon"]["price"]

        add_credits(
            user_id=user_id,
            credits=len(cloth_items) * len(person_items) * price,
            job_name=job_name,
            metadata={"error": str(e)},
        )

        update_job_status(job_id, "failed", {"error": str(e)})

# ==================================================
# API ENDPOINT
# ==================================================
@router.post("")
async def virtual_tryon_endpoint(
    background_tasks: BackgroundTasks,
    job_name: str = Form(...),
    cloth_images: List[UploadFile] = File(...),
    person_images: List[UploadFile] = File(...),
    current_user: Any = Depends(get_current_user),
):
    user_id = extract_user_id(current_user)
    job_name = normalize_job_name(job_name)

    cfg = image_type_selection_coll.find_one({"user_id": user_id})["tryon"]
    quality, size, price = cfg["quality"], cfg["size"], cfg["price"]

    if job_name_exists_for_user(user_id, job_name):
        raise HTTPException(409, "Job already exists")

    # =========================
    # PERSON IMAGES (SKIP MISMATCHED)
    # =========================
    person_items = []
    skipped_person_items = []

    for p in person_images:
        data = await p.read()
        img = Image.open(BytesIO(data))
        uploaded_size = f"{img.width}x{img.height}"

        if uploaded_size != size:
            skipped_person_items.append({
                "model_name": normalize_filename(p.filename),
                "uploaded_size": uploaded_size,
                "required_size": size,
            })
            continue  # ✅ SKIP, DO NOT FAIL

        person_items.append({
            "bytes": data,
            "model_name": normalize_filename(p.filename),
        })

    # ❌ If NONE match → then fail
    if not person_items:
        raise HTTPException(
            400,
            f"No person images match the selected size {size}"
        )

    # =========================
    # CLOTH IMAGES
    # =========================
    cloth_items = []
    used = set()

    for c in cloth_images:
        data = await c.read()
        name = normalize_filename(c.filename)
        while name in used:
            name += "_1"
        used.add(name)

        cloth_url = upload_cloth_image_to_blob(
            image_bytes=data,
            user_id=user_id,
            job_name=job_name,
            cloth_name=name,
        )

        cloth_items.append({
            "bytes": data,
            "cloth_name": name,
            "cloth_url": cloth_url,
        })

    total_images = len(person_items) * len(cloth_items)

    deduct_credits(
        user_id=user_id,
        total_credits=total_images * price,
        reason="virtual_tryon",
        job_name=job_name,
        metadata={
            "total_images": total_images,
            "image_size": size,
            "quality": quality,
            "cost_per_image": price,
        },
    )

    job_id = save_job_document(
        job_name=job_name,
        status="processing",
        prompt=PERMANENT_TRYON_PROMPT,
        image_size=size, 
        user_id=user_id,
        cloth_blob_map={},
        created_at=datetime.utcnow(),
    )

    background_tasks.add_task(
        run_virtual_tryon_job,
        job_id,
        user_id,
        job_name,
        cloth_items,
        person_items,
        quality,
        size,
    )

    return {
        "job_id": job_id,
        "status": "processing",
        "generated_images": total_images,
    }
