

from dotenv import load_dotenv
load_dotenv()

import os
import requests
from typing import List, Optional
from datetime import datetime, timedelta
from io import BytesIO
from zipfile import ZipFile

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId

from roles import get_current_user
from virtual_tryon_db_connection import get_jobs_by_user, jobs_coll
from azure.storage.blob import generate_blob_sas, BlobSasPermissions
from urllib.parse import urlparse

# =====================================================
# ENV
# =====================================================
ACCOUNT = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "virtualclothstorage")
SAS_EXPIRY_MINUTES = int(os.getenv("AZURE_SAS_EXPIRY_MINUTES", "5"))

if not ACCOUNT or not ACCOUNT_KEY:
    raise RuntimeError("❌ Azure storage credentials missing")

router = APIRouter(tags=["User Images"])

# =====================================================
# RESPONSE MODELS
# =====================================================
class ClothGroupItem(BaseModel):
    job_name: str
    cloth_name: str
    created_at: datetime
    cloth_image_url: str
    generated_urls: List[str]


class ImagesResponse(BaseModel):
    user_id: str
    total_cloths: int
    images: List[ClothGroupItem]

# =====================================================
# HELPERS
# =====================================================


# =====================================================
# HELPERS
# =====================================================
def create_sas_url(full_blob_url: str) -> str:
    """
    Accepts FULL Azure blob URL stored in DB and
    returns SAS-protected URL.
    """

    parsed = urlparse(full_blob_url)

    # parsed.path => /container/blobname
    path_parts = parsed.path.lstrip("/").split("/", 1)

    if len(path_parts) != 2:
        raise ValueError("Invalid Azure blob URL format")

    container_name, blob_name = path_parts

    expiry = datetime.utcnow() + timedelta(minutes=SAS_EXPIRY_MINUTES)

    sas = generate_blob_sas(
        account_name=ACCOUNT,
        container_name=container_name,
        blob_name=blob_name,
        account_key=ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=expiry,
        protocol="https",
    )

    return f"{parsed.scheme}://{parsed.netloc}/{container_name}/{blob_name}?{sas}"



def download_blob_via_sas(sas_url: str) -> bytes | None:
    try:
        r = requests.get(sas_url, timeout=30)
        r.raise_for_status()
        return r.content
    except Exception:
        return None

# =====================================================
# GET IMAGES (DATE + BATCH + SOFT DELETE SAFE)
# =====================================================
@router.get("/my/images", response_model=ImagesResponse)
def get_my_images(
    current_user: dict = Depends(get_current_user),
    job_name: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
):
    user_id = str(current_user.get("_id"))
    if not user_id:
        raise HTTPException(401, "Invalid user")

    # ---- FROM–TO DATE FILTER ----
    start_dt = end_dt = None
    if from_date and to_date:
        try:
            start_dt = datetime.strptime(from_date, "%Y-%m-%d")
            end_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(400, "Invalid date format (YYYY-MM-DD)")
    elif from_date or to_date:
        raise HTTPException(400, "Both from_date and to_date are required")

    jobs = get_jobs_by_user(user_id, limit=500)
    rows: List[ClothGroupItem] = []

    for job in jobs:
        if job.get("deleted") is True:
            continue

        if job_name and job.get("job_name") != job_name:
            continue

        created_at = job.get("created_at")
        if not created_at:
            continue

        if start_dt and end_dt:
            if not (start_dt <= created_at < end_dt):
                continue

        cloth_blob_map = job.get("cloth_blob_map") or {}

        for cloth_name, payload in cloth_blob_map.items():
            if not isinstance(payload, dict):
                continue

            if payload.get("deleted") is True:
                continue

            cloth_blob = payload.get("cloth_image_url")
            generated = payload.get("generated_urls", [])

            if not cloth_blob or not generated:
                continue

            rows.append(
                ClothGroupItem(
                    job_name=job["job_name"],
                    cloth_name=cloth_name,
                    created_at=created_at,
                    cloth_image_url=create_sas_url(cloth_blob),
                    generated_urls=[create_sas_url(p) for p in generated],
                )
            )

    return ImagesResponse(
        user_id=user_id,
        total_cloths=len(rows),
        images=rows,
    )


# =====================================================
# SOFT DELETE CLOTH
# =====================================================
@router.delete("/my/cloth")
def soft_delete_cloth(
    job_name: str = Query(...),
    cloth_name: str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user.get("_id"))
    if not user_id:
        raise HTTPException(401, "Invalid user")

    result = jobs_coll.update_one(
        {
            "user_id": user_id,
            "job_name": job_name,
            f"cloth_blob_map.{cloth_name}": {"$exists": True},
        },
        {
            "$set": {
                f"cloth_blob_map.{cloth_name}.deleted": True,
                f"cloth_blob_map.{cloth_name}.deleted_at": datetime.utcnow(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Cloth not found")

    return {
        "status": "success",
        "message": "Cloth soft-deleted",
        "job_name": job_name,
        "cloth_name": cloth_name,
    }

# =====================================================
# DOWNLOAD ZIP (SOFT DELETE SAFE)
# =====================================================
@router.get("/my/download-zip")
def download_my_images_zip(
    current_user: dict = Depends(get_current_user),
    job_name: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
):
    user_id = str(current_user.get("_id"))
    if not user_id:
        raise HTTPException(401, "Invalid user")

    start_dt = end_dt = None
    if date:
        try:
            start_dt = datetime.strptime(date, "%Y-%m-%d")
            end_dt = start_dt + timedelta(days=1)
        except ValueError:
            raise HTTPException(400, "Invalid date format (YYYY-MM-DD)")

    jobs = get_jobs_by_user(user_id, limit=300)
    zip_buffer = BytesIO()
    found = False

    with ZipFile(zip_buffer, "w") as zipf:
        for job in jobs:
            if job.get("deleted") is True:
                continue

            if job_name and job.get("job_name") != job_name:
                continue

            created_at = job.get("created_at")
            if date and not (start_dt <= created_at < end_dt):
                continue

            cloth_blob_map = job.get("cloth_blob_map") or {}

            for cloth_name, payload in cloth_blob_map.items():

                if not isinstance(payload, dict):
                    continue

                if payload.get("deleted") is True:
                    continue

                cloth_blob = payload.get("cloth_image_url")
                generated = payload.get("generated_urls", [])

                if not cloth_blob:
                    continue

                found = True
                base_folder = f"{job.get('job_name')}/{cloth_name}"

                cloth_data = download_blob_via_sas(create_sas_url(cloth_blob))
                if cloth_data:
                    zipf.writestr(f"{base_folder}/cloth.png", cloth_data)

                for idx, gen_blob in enumerate(generated):
                    gen_data = download_blob_via_sas(create_sas_url(gen_blob))
                    if gen_data:
                        zipf.writestr(
                            f"{base_folder}/gen_{idx + 1}.png",
                            gen_data,
                        )

    if not found:
        raise HTTPException(404, "No images found")

    zip_buffer.seek(0)

    filename = job_name or "images"
    if date:
        filename += f"_{date}"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.zip"'
        },
    )
