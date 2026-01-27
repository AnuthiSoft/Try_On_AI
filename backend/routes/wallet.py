from fastapi import APIRouter, Depends
from roles import get_current_user
from db import wallets_coll, transactions_coll
from services.wallet_service import create_wallet_for_user

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)

# =========================
# GET WALLET BALANCE
# =========================
@router.get("/")
@router.get("")
def wallet(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])
    user_type = current_user.get("user_type", "normal")

    wallet = wallets_coll.find_one({"user_id": user_id})

    if not wallet:
        create_wallet_for_user(user_id=user_id, user_type=user_type)
        wallet = wallets_coll.find_one({"user_id": user_id})

    return {
        "credits": wallet.get("credits", 0),
        "refund": wallet.get("refund", 0),
        "user_type": wallet.get("user_type")
    }


# =========================
# WALLET TRANSACTIONS
# =========================
@router.get("/transactions")
@router.get("/transactions/")
def wallet_transactions(current_user=Depends(get_current_user)):
    user_id = str(current_user["_id"])

    txns = list(
        transactions_coll
        .find({"user_id": user_id})
        .sort("created_at", -1)
    )

    for t in txns:
        t["_id"] = str(t["_id"])

    return txns
