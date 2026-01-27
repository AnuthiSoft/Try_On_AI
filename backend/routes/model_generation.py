import os
import base64
import requests
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from PIL import Image, ImageOps
from io import BytesIO

from roles import get_current_user
from db import image_type_selection_coll
from services.wallet_service import deduct_credits, refund_credits  # ✅ FIX

from model_generation_db import (
    log_job,
    update_job
)

from azure_blob_storage import upload_human_generated_image_to_blob

# =====================================================
# ENV
# =====================================================
load_dotenv()

AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_IMAGE_ENDPOINT")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_KEY")

if not AZURE_ENDPOINT or not AZURE_API_KEY:
    raise RuntimeError("❌ Azure OpenAI Image config missing")

# =====================================================
# ROUTERS
# =====================================================
router = APIRouter(
    prefix="/model-generation",
    tags=["Model Generation"]
)

image_router = APIRouter(
    prefix="/image",
    tags=["Model Generation (Legacy)"]
)

# =====================================================
# HEADERS
# =====================================================
def get_headers():
    return {
        "api-key": AZURE_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

# =====================================================
# REQUEST / RESPONSE MODELS
# =====================================================
class ImageRequest(BaseModel):
    prompt: str

class ImageResponse(BaseModel):
    job_id: str
    blob_url: str
    credits_used: int

# =====================================================
# AZURE IMAGE GENERATION
# =====================================================
def generate_image(prompt: str, size: str) -> bytes:
    payload = {
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": size,
        "n": 1
    }

    response = requests.post(
        AZURE_ENDPOINT,
        headers=get_headers(),
        json=payload,
        timeout=120
    )

    try:
        data = response.json()
    except Exception:
        raise RuntimeError("Azure returned non-JSON response")

    if response.status_code != 200:
        raise RuntimeError(f"Azure error: {data}")

    if "data" not in data or not data["data"]:
        raise RuntimeError(f"No image data returned: {data}")

    return base64.b64decode(data["data"][0]["b64_json"])


def normalize_image_size(image_bytes: bytes, expected_size: str) -> bytes:
    expected_w, expected_h = map(int, expected_size.split("x"))

    img = Image.open(BytesIO(image_bytes)).convert("RGB")

    # 🔥 STRIP EXIF ORIENTATION COMPLETELY
    img = ImageOps.exif_transpose(img)

    # 🔒 ENFORCE EXACT SIZE (last line of defense)
    if img.size != (expected_w, expected_h):
        img = img.resize((expected_w, expected_h), Image.LANCZOS)

    output = BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()


# =====================================================
# CORE LOGIC
# =====================================================
def _generate_model_image(
    body: ImageRequest,
    current_user: dict
) -> ImageResponse:

    prompt = body.prompt.strip()

    # ✅ STRONGER PROMPT VALIDATION (OPTIONAL BUT GOOD)
    if len(prompt) < 3:
        raise HTTPException(400, "Prompt must be at least 3 characters")

    # Enterprise approval check
    if (
        current_user.get("user_type") == "enterprise"
        and current_user.get("approval_status") != "approved"
    ):
        raise HTTPException(403, "Enterprise account not approved")

    user_id = str(current_user["_id"])

    # -------------------------------------------------
    # READ USER SELECTION
    # -------------------------------------------------
    selection = image_type_selection_coll.find_one(
        {"user_id": user_id}
    )

    if not selection or "model_generation" not in selection:
        raise HTTPException(
            400,
            "Please select model generation size before generating image"
        )

    model_cfg = selection["model_generation"]

    size = model_cfg.get("size")
    credit_cost = model_cfg.get("price")

    if not size or credit_cost is None:
        raise HTTPException(
            500,
            "Invalid model generation selection configuration"
        )

    # -------------------------------------------------
    # CREATE JOB
    # -------------------------------------------------
    job_id = log_job(
        job_type="model_generation",
        status="processing",
        prompt=prompt,
        size=size,
        user_id=user_id,
    )

    # -------------------------------------------------
    # DEDUCT WALLET
    # -------------------------------------------------
    deduct_credits(
        user_id=user_id,
        total_credits=credit_cost,
        reason="model_generation",
        job_name=job_id,
        metadata={
            "job_id": job_id,
            "size": size,
            "credits": credit_cost,
            "source": "image_type_selection",
        },
    )

    try:
        # -------------------------------------------------
        # GENERATE IMAGE
        # -------------------------------------------------
        raw_image_bytes = generate_image(
            prompt=prompt,
            size=size,
        )

        image_bytes = normalize_image_size(
            raw_image_bytes,
            expected_size=size
        )


        blob_url = upload_human_generated_image_to_blob(
            image_bytes=image_bytes,
            user_id=user_id,
            job_id=job_id,
        )

        update_job(
            job_id=job_id,
            status="success",
            blob_url=blob_url,
        )

        return ImageResponse(
            job_id=job_id,
            blob_url=blob_url,
            credits_used=credit_cost,
        )

    except Exception as e:
        # -------------------------------------------------
        # 🔁 CORRECT REFUND (NOT CREDIT)
        # -------------------------------------------------
        refund_credits(
            user_id=user_id,
            credits=credit_cost,
            reason="model_generation_failed",
            job_name=job_id,
        )

        update_job(
            job_id=job_id,
            status="failed",
            error_message=str(e),
        )

        raise HTTPException(500, str(e))

# =====================================================
# ENDPOINTS
# =====================================================
@router.post("/generate", response_model=ImageResponse)
def generate_model_image(
    body: ImageRequest,
    current_user: dict = Depends(get_current_user),
):
    return _generate_model_image(body, current_user)


@image_router.post("/generate", response_model=ImageResponse)
def generate_model_image_legacy(
    body: ImageRequest,
    current_user: dict = Depends(get_current_user),
):
    return _generate_model_image(body, current_user)
