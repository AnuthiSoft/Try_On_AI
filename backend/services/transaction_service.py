from datetime import datetime, timezone
from typing import Optional
from db import transactions_coll


def log_transaction(
    user_id: str,
    txn_type: str,                 # credit | debit | refund
    reason: str,                   # model_generation | virtual_tryon | payment
    credits: int,
    amount_rs: int = 0,
    images_generated: int = 0,
    cost_per_image: int = 0,
    job_name: Optional[str] = None,
    metadata: Optional[dict] = None,
):
    if txn_type not in {"credit", "debit", "refund"}:
        raise ValueError("txn_type must be 'credit', 'debit', or 'refund'")

    if credits <= 0:
        raise ValueError("credits must be > 0")

    doc = {
        "user_id": user_id,
        "type": txn_type,
        "reason": reason,
        "credits": credits,
        "amount_rs": amount_rs,
        "images_generated": images_generated,
        "cost_per_image": cost_per_image,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }

    if job_name:
        doc["job_name"] = job_name

    transactions_coll.insert_one(doc)
