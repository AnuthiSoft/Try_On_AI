from datetime import datetime
from typing import Optional, List

from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import os
from dotenv import load_dotenv

# =====================================================
# LOAD ENV
# =====================================================
load_dotenv()

# =====================================================
# MONGO CONFIG
# =====================================================
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("AUTH_DB_NAME")
JOBS_COLLECTION_NAME = "image_jobs"

# =====================================================
# SAFETY CHECKS
# =====================================================
if not MONGO_URI:
    raise RuntimeError("❌ MONGO_URI missing in .env")

if not DATABASE_NAME:
    raise RuntimeError("❌ AUTH_DB_NAME missing in .env")

if not (
    MONGO_URI.startswith("mongodb://")
    or MONGO_URI.startswith("mongodb+srv://")
):
    raise RuntimeError(f"❌ Invalid MONGO_URI: {MONGO_URI}")

print("🔹 Connecting to MongoDB Atlas")

# =====================================================
# CONNECT
# =====================================================
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
client.admin.command("ping")

db = client[DATABASE_NAME]
jobs_collection = db[JOBS_COLLECTION_NAME]

# ✅ INDEXES (VERY IMPORTANT FOR UI)
jobs_collection.create_index(
    [("user_id", ASCENDING), ("created_at", DESCENDING)]
)
jobs_collection.create_index(
    [("job_type", ASCENDING), ("status", ASCENDING)]
)

print(f"✅ MongoDB connected | DB={DATABASE_NAME} | Collection={JOBS_COLLECTION_NAME}")

# =====================================================
# CREATE / LOG JOB
# =====================================================
def log_job(
    *,
    job_type: str,                     # model_generation | virtual_tryon
    status: str,                       # processing | success | failed
    user_id: str,
    prompt: Optional[str] = None,
    size: Optional[str] = None,
    quality: Optional[str] = None,
    blob_url: Optional[str] = None,
    error_message: Optional[str] = None,
) -> str:
    """
    Create a new job entry and return job_id
    """

    doc = {
        "job_type": job_type,
        "status": status,
        "user_id": ObjectId(user_id),
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "blob_url": blob_url,
        "error_message": error_message,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = jobs_collection.insert_one(doc)
    return str(result.inserted_id)

# =====================================================
# UPDATE JOB (CRITICAL)
# =====================================================
def update_job(
    *,
    job_id: str,
    status: str,
    blob_url: Optional[str] = None,
    error_message: Optional[str] = None,
):
    """
    Update job status — REQUIRED for UI to stop 'Generating'
    """

    update_fields = {
        "status": status,
        "updated_at": datetime.utcnow(),
    }

    if blob_url is not None:
        update_fields["blob_url"] = blob_url

    if error_message is not None:
        update_fields["error_message"] = error_message

    jobs_collection.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_fields}
    )

# =====================================================
# FETCH USER JOBS (FOR UI)
# =====================================================
def get_user_jobs(
    *,
    user_id: str,
    job_type: Optional[str] = "model_generation",
    limit: int = 20,
) -> List[dict]:
    """
    Fetch job history for UI (default = model_generation)
    """

    query = {
        "user_id": ObjectId(user_id),
        "status": "success",
    }

    if job_type:
        query["job_type"] = job_type

    cursor = (
        jobs_collection
        .find(
            query,
            {
                "job_type": 1,
                "prompt": 1,
                "size": 1,
                "quality": 1,
                "blob_url": 1,
                "created_at": 1,
            }
        )
        .sort("created_at", DESCENDING)
        .limit(limit)
    )

    jobs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        jobs.append(doc)

    return jobs
