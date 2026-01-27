
# =====================================================
# MongoDB Atlas – Virtual Try-On DB (FINAL – NO GRIDFS)
# =====================================================

from pymongo import MongoClient, ASCENDING
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

# =====================================================
# LOAD ENV
# =====================================================
load_dotenv()

# =====================================================
# CONFIG
# =====================================================
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("AUTH_DB_NAME")
JOBS_COLLECTION_NAME = "virtual_tryon_jobs"

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

# =====================================================
# CONNECTION (LAZY-SAFE)
# =====================================================
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DATABASE_NAME]
jobs_coll = db[JOBS_COLLECTION_NAME]

# =====================================================
# ENSURE INDEXES (SAFE TO CALL MULTIPLE TIMES)
# =====================================================
def ensure_indexes():
    """
    Must be called ONCE on app startup.
    Prevents duplicate job_name per user.
    """
    jobs_coll.create_index(
        [("user_id", ASCENDING), ("job_name", ASCENDING)],
        unique=True,
        name="user_job_unique",
    )

# =====================================================
# CONNECTION CHECK (OPTIONAL)
# =====================================================
def ensure_connection():
    """
    Optional health check.
    Call once on startup if needed.
    """
    client.admin.command("ping")

# =====================================================
# JOB NAME DUPLICATE CHECK (SECONDARY SAFETY)
# =====================================================
def job_name_exists_for_user(user_id: str, job_name: str) -> bool:
    return jobs_coll.find_one(
        {"user_id": str(user_id), "job_name": job_name},
        {"_id": 1},
    ) is not None

# =====================================================
# SAVE JOB DOCUMENT (ONE PER BATCH)
# =====================================================
def save_job_document(
    *,
    job_name: str,
    status: str,
    prompt: str,
    image_size: str,
    user_id: str,
    cloth_blob_map: dict,
    created_at: datetime | None = None,
):
    """
    Creates ONE document per batch.
    No image data stored — only URLs.
    """

    doc = {
        "job_name": job_name,
        "status": status,                # processing | success | failed
        "prompt": prompt,
        "image_size": image_size,
        "user_id": str(user_id),
        "cloth_blob_map": cloth_blob_map or {},
        "created_at": created_at or datetime.utcnow(),
        "error_message": None,
    }

    result = jobs_coll.insert_one(doc)
    return str(result.inserted_id)

# =====================================================
# UPDATE JOB STATUS (BACKGROUND WORKER)
# =====================================================
def update_job_status(
    job_id: str,
    status: str,
    cloth_blob_map: dict | None = None,
    error_message: str | None = None,
):
    update = {
        "status": status,
        "updated_at": datetime.utcnow(),
    }

    if cloth_blob_map is not None:
        update["cloth_blob_map"] = cloth_blob_map

    if error_message:
        update["error_message"] = error_message

    jobs_coll.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update},
    )

# =====================================================
# GET JOBS BY USER
# =====================================================
def get_jobs_by_user(
    user_id: str,
    *,
    limit: int = 100,
    skip: int = 0,
    only_success: bool = False,
):
    query = {"user_id": str(user_id)}

    if only_success:
        query["status"] = "success"

    cursor = (
        jobs_coll.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [{**doc, "_id": str(doc["_id"])} for doc in cursor]

# =====================================================
# GET SINGLE JOB BY NAME
# =====================================================
def get_job_by_name(user_id: str, job_name: str):
    doc = jobs_coll.find_one(
        {"user_id": str(user_id), "job_name": job_name}
    )
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc
