from fastapi import HTTPException
from db import image_pricing_coll

MODEL_PRICING_ID = "MODEL_GENERATION_PRICING"
TRYON_PRICING_ID = "TRYON_PRICING"

VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024"]
VALID_QUALITIES = ["basic", "standard", "premium"]


def get_price_and_validate(
    *,
    image_type: str,
    size: str,
    quality: str | None,
    user_role: str
) -> int:
    """
    Validates size/quality and returns correct price
    based on user role (normal / enterprise)
    """

    if user_role not in ["normal", "enterprise"]:
        raise HTTPException(403, "Invalid user role")

    if size not in VALID_SIZES:
        raise HTTPException(400, "Invalid image size")

    # ================= MODEL GENERATION =================
    if image_type == "model":
        doc = image_pricing_coll.find_one({"_id": MODEL_PRICING_ID})
        if not doc:
            raise HTTPException(500, "Model pricing not configured")

        try:
            return doc["size_only"][size][user_role]
        except KeyError:
            raise HTTPException(400, "Pricing not found for selection")

    # ================= VIRTUAL TRY-ON =================
    if image_type == "tryon":
        if quality not in VALID_QUALITIES:
            raise HTTPException(400, "Invalid quality")

        doc = image_pricing_coll.find_one({"_id": TRYON_PRICING_ID})
        if not doc:
            raise HTTPException(500, "Try-on pricing not configured")

        try:
            return doc["quality_size"][quality][size][user_role]
        except KeyError:
            raise HTTPException(400, "Pricing not found for selection")

    raise HTTPException(400, "Invalid image type")
