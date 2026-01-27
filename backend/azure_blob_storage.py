
# azure_blob_storage.py

from dotenv import load_dotenv
load_dotenv()

import os
from typing import Optional
from azure.storage.blob import (
    BlobServiceClient,
    ContentSettings,
)

# =====================================================
# ENV
# =====================================================
AZURE_CONN_STR = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "virtual-tryon-images")

_blob_service_client = None
if AZURE_CONN_STR:
    try:
        _blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_CONN_STR
        )
    except Exception as e:
        print("❌ Failed to init BlobServiceClient:", e)
        _blob_service_client = None

print("🧪 BlobServiceClient initialized:", _blob_service_client is not None)
print("🧪 Azure container:", AZURE_CONTAINER)

# =====================================================
# HELPERS
# =====================================================
def _sanitize(value: str) -> str:
    return value.strip().replace(" ", "_").lower()


def _get_container(container_name: str):
    if not _blob_service_client:
        raise RuntimeError("Azure Blob client not initialized")

    container_client = _blob_service_client.get_container_client(container_name)
    if not container_client.exists():
        container_client.create_container()
    return container_client


# =====================================================
# UPLOAD CLOTH IMAGE
# =====================================================
def upload_cloth_image_to_blob(
    *,
    image_bytes: bytes,
    user_id: str,
    job_name: str,
    cloth_name: str,
    container: Optional[str] = None
) -> str:
    """
    <container>/<user_id>/<job_name>_<cloth_name>.png
    """

    if not _blob_service_client:
        raise RuntimeError("Azure Blob client not initialized")

    container_name = container or AZURE_CONTAINER

    safe_job = _sanitize(job_name)
    safe_cloth = _sanitize(cloth_name)

    filename = f"{safe_job}_{safe_cloth}.png"
    blob_path = f"{user_id}/{filename}"

    try:
        container_client = _get_container(container_name)
        blob_client = container_client.get_blob_client(blob_path)

        blob_client.upload_blob(
            image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png"),
        )

        return blob_client.url

    except Exception as e:
        print("❌ upload_cloth_image_to_blob FAILED:", e)
        raise


# =====================================================
# UPLOAD GENERATED IMAGE (TRY-ON / MODEL)
# =====================================================
def upload_generated_image_to_blob(
    *,
    image_bytes: bytes,
    user_id: str,
    job_name: str,
    cloth_name: str,
    model_name: str,
    container: Optional[str] = None
) -> str:
    """
    <container>/<user_id>/<job_name>_<cloth_name>_<model_name>.png
    """

    if not _blob_service_client:
        raise RuntimeError("Azure Blob client not initialized")

    container_name = container or AZURE_CONTAINER

    safe_job = _sanitize(job_name)
    safe_cloth = _sanitize(cloth_name)
    safe_model = _sanitize(model_name)

    filename = f"{safe_job}_{safe_cloth}_{safe_model}.png"
    blob_path = f"{user_id}/{filename}"

    try:
        container_client = _get_container(container_name)
        blob_client = container_client.get_blob_client(blob_path)

        blob_client.upload_blob(
            image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png"),
        )

        return blob_client.url

    except Exception as e:
        print("❌ upload_generated_image_to_blob FAILED:", e)
        raise


# =====================================================
# UPLOAD HUMAN GENERATED IMAGE (UPDATED)
# =====================================================
def upload_human_generated_image_to_blob(
    *,
    image_bytes: bytes,
    user_id: str,
    job_id: str,
    container: Optional[str] = None
) -> str:
    """
    <container>/<user_id>/human_<job_id>.png
    """

    if not _blob_service_client:
        raise RuntimeError("Azure Blob client not initialized")

    container_name = container or AZURE_CONTAINER

    # ✅ SAME FOLDER AS TRY-ON IMAGES
    filename = f"human_{job_id}.png"
    blob_path = f"{user_id}/{filename}"

    print("📤 Uploading HUMAN image to Azure Blob:", blob_path)

    try:
        container_client = _get_container(container_name)
        blob_client = container_client.get_blob_client(blob_path)

        blob_client.upload_blob(
            image_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="image/png"),
        )

        print("✅ Blob upload successful:", blob_client.url)
        return blob_client.url

    except Exception as e:
        print("❌ upload_human_generated_image_to_blob FAILED:", e)
        raise
