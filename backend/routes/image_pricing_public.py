from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

from roles import get_current_user
from db import image_pricing_coll, image_type_selection_coll

router = APIRouter(
    prefix="/api/pricing",
    tags=["Pricing"]
)

MODEL_PRICING_ID = "MODEL_GENERATION_PRICING"
TRYON_PRICING_ID = "TRYON_PRICING"

# =====================================================
# ROLE NORMALIZATION
# =====================================================
def normalize_role(role: str) -> str:
    if role in ["super_admin", "admin", "user"]:
        return "normal"
    if role == "enterprise":
        return "enterprise"
    return "normal"


# =====================================================
# VIEW MODEL PRICING (USER)
# =====================================================
@router.get("/model")
def view_model_pricing(user=Depends(get_current_user)):
    role = normalize_role(user["role"])

    doc = image_pricing_coll.find_one(
        {"_id": MODEL_PRICING_ID},
        {"_id": 0}
    )

    if not doc or "size_only" not in doc:
        raise HTTPException(404, "Model pricing not found")

    return {
        "pricing_type": "model",
        "role": role,
        "prices": {
            size: values.get(role, 0)
            for size, values in doc["size_only"].items()
        }
    }


# =====================================================
# VIEW TRY-ON PRICING (USER)
# =====================================================
@router.get("/tryon")
def view_tryon_pricing(user=Depends(get_current_user)):
    role = normalize_role(user["role"])

    doc = image_pricing_coll.find_one(
        {"_id": TRYON_PRICING_ID},
        {"_id": 0}
    )

    if not doc or "quality_size" not in doc:
        raise HTTPException(404, "Try-on pricing not found")

    prices = {}
    for quality, sizes in doc["quality_size"].items():
        prices[quality] = {
            size: values.get(role, 0)
            for size, values in sizes.items()
        }

    return {
        "pricing_type": "tryon",
        "role": role,
        "prices": prices
    }


# =====================================================
# STORE / UPDATE USER SELECTION (FINAL)
# =====================================================
class ImageSelectionRequest(BaseModel):
    mode: Literal["model", "tryon"]
    size: str
    quality: Optional[str] = None


@router.post("/select")
def select_image_type(
    body: ImageSelectionRequest,
    user=Depends(get_current_user)
):
    user_id = str(user["_id"])
    role = normalize_role(user["role"])

    update_fields = {
        "user_id": user_id,
        "role": role,
        "updated_at": datetime.utcnow()
    }

    # =========================
    # MODEL GENERATION
    # =========================
    if body.mode == "model":
        doc = image_pricing_coll.find_one(
            {"_id": MODEL_PRICING_ID}
        )
        if not doc or "size_only" not in doc:
            raise HTTPException(404, "Model pricing not found")

        size_block = doc["size_only"].get(body.size)
        if not size_block:
            raise HTTPException(400, "Invalid model image size")

        update_fields["model_generation"] = {
            "size": body.size,
            "price": size_block.get(role, 0)
        }

    # =========================
    # TRY-ON
    # =========================
    else:
        if not body.quality:
            raise HTTPException(400, "Quality is required for try-on")

        doc = image_pricing_coll.find_one(
            {"_id": TRYON_PRICING_ID}
        )
        if not doc or "quality_size" not in doc:
            raise HTTPException(404, "Try-on pricing not found")

        quality_block = doc["quality_size"].get(body.quality)
        if not quality_block:
            raise HTTPException(400, "Invalid try-on quality")

        size_block = quality_block.get(body.size)
        if not size_block:
            raise HTTPException(400, "Invalid try-on image size")

        update_fields["tryon"] = {
            "quality": body.quality,
            "size": body.size,
            "price": size_block.get(role, 0)
        }

    # =========================
    # UPSERT (ONE DOC PER USER)
    # =========================
    image_type_selection_coll.update_one(
        {"user_id": user_id},
        {"$set": update_fields},
        upsert=True
    )

    return {
        "message": "Image configuration saved successfully",
        "updated": body.mode
    }
