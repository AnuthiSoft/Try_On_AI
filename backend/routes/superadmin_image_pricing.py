from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import logging

from roles import get_current_user
from db import image_pricing_coll

router = APIRouter(
    prefix="/api/admin",
    tags=["Super Admin Pricing"]
)

# =====================
# LOGGING
# =====================
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# =====================
# CONSTANTS
# =====================
MODEL_PRICING_ID = "MODEL_GENERATION_PRICING"
TRYON_PRICING_ID = "TRYON_PRICING"

SIZES = ["1024x1024", "1024x1536", "1536x1024"]
QUALITIES = ["basic", "standard", "premium"]
USER_TYPES = ["normal", "enterprise"]

# =====================
# RBAC
# =====================
def super_admin_only(user=Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if user.get("role") != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admin allowed"
        )
    return user

# =====================
# VALIDATORS
# =====================
def validate_size_only(payload: Dict):
    if not isinstance(payload, dict):
        raise HTTPException(400, "Invalid payload format")

    if "size_only" not in payload:
        raise HTTPException(400, "size_only required")

    for size in SIZES:
        if size not in payload["size_only"]:
            raise HTTPException(400, f"Missing size {size}")

        for user_type in USER_TYPES:
            price = payload["size_only"][size].get(user_type)
            if not isinstance(price, (int, float)) or price < 0:
                raise HTTPException(
                    400,
                    f"Invalid price for {size}.{user_type}"
                )


def validate_quality_size(payload: Dict):
    if not isinstance(payload, dict):
        raise HTTPException(400, "Invalid payload format")

    if "quality_size" not in payload:
        raise HTTPException(400, "quality_size required")

    for quality in QUALITIES:
        if quality not in payload["quality_size"]:
            raise HTTPException(400, f"Missing quality {quality}")

        for size in SIZES:
            if size not in payload["quality_size"][quality]:
                raise HTTPException(400, f"Missing {quality}.{size}")

            for user_type in USER_TYPES:
                price = payload["quality_size"][quality][size].get(user_type)
                if not isinstance(price, (int, float)) or price < 0:
                    raise HTTPException(
                        400,
                        f"Invalid price for {quality}.{size}.{user_type}"
                    )

# =================================================
# GET — LOAD EXISTING PRICES
# =================================================
@router.get("/model-pricing")
def get_model_pricing(user=Depends(super_admin_only)):
    doc = image_pricing_coll.find_one(
        {"_id": MODEL_PRICING_ID},
        {"_id": 0}
    )
    return doc or {"size_only": {}}


@router.get("/tryon-pricing")
def get_tryon_pricing(user=Depends(super_admin_only)):
    doc = image_pricing_coll.find_one(
        {"_id": TRYON_PRICING_ID},
        {"_id": 0}
    )
    return doc or {"quality_size": {}}

# =================================================
# PUT — UPDATE MODEL PRICING
# =================================================
@router.put("/model-pricing", status_code=status.HTTP_200_OK)
def update_model_pricing(
    payload: Dict,
    user=Depends(super_admin_only)
):
    validate_size_only(payload)

    document = {
        "_id": MODEL_PRICING_ID,
        "pricing_type": "model_generation",
        "size_only": payload["size_only"]
    }

    logger.info("Saving model pricing")

    result = image_pricing_coll.replace_one(
        {"_id": MODEL_PRICING_ID},
        document,
        upsert=True
    )

    return {
        "message": "Model generation pricing saved successfully",
        "created": bool(result.upserted_id),
        "matched": result.matched_count,
        "modified": result.modified_count
    }

# =================================================
# PUT — UPDATE TRY-ON PRICING
# =================================================
@router.put("/tryon-pricing", status_code=status.HTTP_200_OK)
def update_tryon_pricing(
    payload: Dict,
    user=Depends(super_admin_only)
):
    validate_quality_size(payload)

    document = {
        "_id": TRYON_PRICING_ID,
        "pricing_type": "virtual_tryon",
        "quality_size": payload["quality_size"]
    }

    logger.info("Saving try-on pricing")

    result = image_pricing_coll.replace_one(
        {"_id": TRYON_PRICING_ID},
        document,
        upsert=True
    )

    return {
        "message": "Virtual try-on pricing saved successfully",
        "created": bool(result.upserted_id),
        "matched": result.matched_count,
        "modified": result.modified_count
    }
