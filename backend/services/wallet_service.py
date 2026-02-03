from datetime import datetime, timezone
from fastapi import HTTPException

from db import wallets_coll
from services.transaction_service import log_transaction


# ==================================================
# CREATE WALLET (IDEMPOTENT)
# ==================================================
def create_wallet_for_user(user_id: str, user_type: str):
    free_credits = 10 if user_type == "normal" else 0
    now = datetime.now(timezone.utc)

    wallets_coll.update_one(
        {"user_id": user_id},
        {
            "$setOnInsert": {
                "user_id": user_id,
                "user_type": user_type,
                "credits": free_credits,
                "refund": 0,
                "refund_jobs": [],     # ⛑ prevents double refund
                "created_at": now,
            },
            "$set": {"updated_at": now},
        },
        upsert=True,
    )

    if free_credits > 0:
        log_transaction(
            user_id=user_id,
            txn_type="credit",
            reason="signup_bonus",
            credits=free_credits,
        )


# ==================================================
# GET WALLET (SAFE)
# ==================================================
def get_wallet(user_id: str):
    wallet = wallets_coll.find_one({"user_id": user_id})
    if not wallet:
        raise HTTPException(404, "Wallet not found")

    # safety defaults for old wallets
    wallet.setdefault("credits", 0)
    wallet.setdefault("refund", 0)
    wallet.setdefault("refund_jobs", [])

    return wallet


# ==================================================
# ADD CREDITS (PAYMENT ONLY)
# ==================================================
def add_credits(
    user_id: str,
    credits: int,
    job_name: str | None = None,
    metadata: dict | None = None,
):
    if credits <= 0:
        raise HTTPException(400, "Credits must be positive")

    wallets_coll.update_one(
        {"user_id": user_id},
        {
            "$inc": {"credits": credits},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    log_transaction(
        user_id=user_id,
        txn_type="credit",
        reason="payment",
        credits=credits,
        amount_rs=credits,
        job_name=job_name,
        metadata=metadata,
    )


# ==================================================
# DEDUCT CREDITS (JOB START)
# ==================================================
def deduct_credits(
    user_id: str,
    total_credits: int,
    reason: str,
    job_name: str | None = None,
    metadata: dict | None = None,
):
    if total_credits <= 0:
        raise HTTPException(400, "Invalid credit amount")

    wallet = get_wallet(user_id)

    if wallet["credits"] < total_credits:
        raise HTTPException(402, "Image Generation failed due to insufficient balance")

    wallets_coll.update_one(
        {"user_id": user_id},
        {
            "$inc": {"credits": -total_credits},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    # ✅ SAFE DEFAULTS
    images_generated = metadata.get("total_images", 1) if metadata else 1
    cost_per_image = (
        total_credits // images_generated
        if images_generated > 0
        else total_credits
    )

    log_transaction(
        user_id=user_id,
        txn_type="debit",
        reason=reason,
        credits=total_credits,
        amount_rs=total_credits,
        images_generated=images_generated,   # ✅ CORRECT
        cost_per_image=cost_per_image,       # ✅ CORRECT
        job_name=job_name,
        metadata=metadata,
    )


# ==================================================
# REFUND CREDITS (JOB FAILURE)
# ==================================================
def refund_credits(
    user_id: str,
    credits: int,
    reason: str,
    job_name: str | None = None,
    metadata: dict | None = None,
):
    if credits <= 0:
        return

    wallet = get_wallet(user_id)

    # ⛑ prevent double refund
    if job_name and job_name in wallet.get("refund_jobs", []):
        return

    update_query = {
        "$inc": {"credits": credits},   # ✅ FIX HERE
        "$set": {"updated_at": datetime.now(timezone.utc)},
    }

    if job_name:
        update_query["$addToSet"] = {"refund_jobs": job_name}

    wallets_coll.update_one(
        {"user_id": user_id},
        update_query,
    )

    log_transaction(
        user_id=user_id,
        txn_type="refund",
        reason=reason,
        credits=credits,
        amount_rs=credits,
        job_name=job_name,
        metadata=metadata,
    )
