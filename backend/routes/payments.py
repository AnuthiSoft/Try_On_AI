from fastapi import APIRouter, Depends
from roles import get_current_user
from services.wallet_service import add_credits

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/add-credits")
def add_credit_api(
    credits: int,
    current_user=Depends(get_current_user)
):
    add_credits(str(current_user["_id"]), credits)
    return {"message": "Credits added successfully"}


@router.get("/transactions")
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