from dotenv import load_dotenv
load_dotenv()

import requests
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId

from roles import get_current_user
from model_generation_db import jobs_collection
from user_images import create_sas_url

# =====================================================
# ROUTER
# =====================================================
router = APIRouter(
    prefix="/model-images",
    tags=["Model Image Gallery"]
)

# =====================================================
# RESPONSE MODELS
# =====================================================
class ModelImageItem(BaseModel):
    job_id: str
    created_at: datetime
    image_url: str

class DownloadResponse(BaseModel):
    download_url: str

class MessageResponse(BaseModel):
    message: str

class SelectImagesRequest(BaseModel):
    job_ids: List[str]
    selected: bool
    
# =====================================================
# GET LOGGED-IN USER IMAGES (NOT DELETED)
# =====================================================
@router.get("/my", response_model=List[ModelImageItem])
def get_my_model_images(
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    jobs = jobs_collection.find(
        {
            "user_id": ObjectId(user_id),
            "status": "success",
            "blob_url": {"$exists": True},
            "is_deleted": {"$ne": True},
        }
    ).sort("created_at", -1)

    results: List[ModelImageItem] = []

    for job in jobs:
        results.append(
            ModelImageItem(
                job_id=str(job["_id"]),
                created_at=job["created_at"],
                image_url=create_sas_url(job["blob_url"]),
            )
        )

    return results

# =====================================================
# DOWNLOAD IMAGE FILE (FORCE DOWNLOAD TO PC)
# =====================================================
@router.get("/{job_id}/download-file")
def download_model_image_file(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    # Find the job
    job = jobs_collection.find_one({
        "_id": ObjectId(job_id),
        "user_id": ObjectId(user_id),
        "status": "success",
        "blob_url": {"$exists": True},
        "is_deleted": {"$ne": True},
    })

    if not job:
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        # Generate SAS URL
        sas_url = create_sas_url(job["blob_url"])
        
        # Fetch image from Azure with stream
        response = requests.get(sas_url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Create filename
        timestamp = job["created_at"].strftime("%Y-%m-%d") if job.get("created_at") else datetime.utcnow().strftime("%Y-%m-%d")
        filename = f"model-{job_id[-8:]}-{timestamp}.png"
        
        # Return streaming response
        return StreamingResponse(
            response.iter_content(chunk_size=8192),
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "image/png"
            }
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch image from storage: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# =====================================================
# GET DOWNLOAD URL (SAS URL)
# =====================================================
@router.get("/{job_id}/download", response_model=DownloadResponse)
def get_download_url(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    job = jobs_collection.find_one({
        "_id": ObjectId(job_id),
        "user_id": ObjectId(user_id),
        "status": "success",
        "blob_url": {"$exists": True},
        "is_deleted": {"$ne": True},
    })

    if not job:
        raise HTTPException(status_code=404, detail="Image not found")

    return {
        "download_url": create_sas_url(job["blob_url"])
    }

# =====================================================
# SOFT DELETE IMAGE (DB ONLY)
# =====================================================
@router.delete("/{job_id}", response_model=MessageResponse)
def soft_delete_model_image(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    result = jobs_collection.update_one(
        {
            "_id": ObjectId(job_id),
            "user_id": ObjectId(user_id),
            "is_deleted": {"$ne": True},
        },
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")

    return {"message": "Image deleted successfully"}

# =====================================================
# RESTORE SOFT-DELETED IMAGE
# =====================================================
@router.post("/{job_id}/restore", response_model=MessageResponse)
def restore_model_image(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    result = jobs_collection.update_one(
        {
            "_id": ObjectId(job_id),
            "user_id": ObjectId(user_id),
            "is_deleted": True,
        },
        {
            "$unset": {
                "is_deleted": "",
                "deleted_at": "",
            },
            "$set": {
                "updated_at": datetime.utcnow(),
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Image not found or not deleted"
        )

    return {"message": "Image restored successfully"}


# Select / Unselect Images (Bulk)

@router.post("/select", response_model=MessageResponse)
def select_model_images(
    payload: SelectImagesRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    try:
        job_object_ids = [ObjectId(jid) for jid in payload.job_ids]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job id")

    result = jobs_collection.update_many(
        {
            "_id": {"$in": job_object_ids},
            "user_id": ObjectId(user_id),
            "status": "success",
            "is_deleted": {"$ne": True},
        },
        {
            "$set": {
                "is_selected": payload.selected,
                "updated_at": datetime.utcnow(),
            }
        }
    )

    return {
        "message": f"{result.modified_count} image(s) updated"
    }


# Get ONLY Selected Images (Other Page)

@router.get("/my/selected", response_model=List[ModelImageItem])
def get_my_selected_model_images(
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user")

    jobs = jobs_collection.find(
        {
            "user_id": ObjectId(user_id),
            "status": "success",
            "blob_url": {"$exists": True},
            "is_deleted": {"$ne": True},
            "is_selected": True,
        }
    ).sort("created_at", -1)

    results: List[ModelImageItem] = []

    for job in jobs:
        results.append(
            ModelImageItem(
                job_id=str(job["_id"]),
                created_at=job["created_at"],
                image_url=create_sas_url(job["blob_url"]),
            )
        )

    return results

