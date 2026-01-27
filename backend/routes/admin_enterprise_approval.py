from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from roles import get_current_user
from db import users_coll
from utils.email_approve_status import send_status_email

router = APIRouter(
    prefix="/super-admin",
    tags=["Super Admin"]
)


# =====================================================
# GET ENTERPRISE REQUESTS (FILTER BY STATUS)
# =====================================================
@router.get("/enterprise-requests")
def get_enterprise_requests(
    status: str | None = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can view enterprise requests")

    query = {"user_type": "enterprise"}

    if status in {"pending", "approved", "rejected"}:
        query["approval_status"] = status

    enterprises = users_coll.find(query, {"password": 0})

    return [
        {
            "enterprise_id": str(u["_id"]),
            "username": u.get("username"),
            "email": u.get("email"),
            "phone": u.get("phone"),
            "enterprise_name": u.get("enterprise", {}).get("name"),
            "location": u.get("enterprise", {}).get("location"),
            "approval_status": u.get("approval_status"),
            "created_at": u.get("created_at"),
        }
        for u in enterprises
    ]


# =====================================================
# APPROVE ENTERPRISE (ALLOW FROM ANY STATUS)
# =====================================================
@router.put("/approve-enterprise/{enterprise_id}")

def approve_enterprise(
    enterprise_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can approve enterprises")

    try:
        oid = ObjectId(enterprise_id)
    except InvalidId:
        raise HTTPException(400, "Invalid enterprise ID")

    enterprise = users_coll.find_one({
        "_id": oid,
        "user_type": "enterprise"
    })

    if not enterprise:
        raise HTTPException(404, "Enterprise not found")

    users_coll.update_one(
        {"_id": oid},
        {"$set": {
            "approval_status": "approved",
            "approved_at": datetime.utcnow(),
            "approved_by": str(current_user["_id"]),
            "rejected_at": None,
            "rejected_by": None
        }}
    )

    # 📧 EMAIL
    send_status_email(
        to_email=enterprise["email"],
        username=enterprise.get("username", ""),
        status="approved",
        enterprise_name=enterprise.get("enterprise", {}).get("name", "")
    )

    return {"message": "Enterprise approved successfully"}


# =====================================================
# REJECT ENTERPRISE (ALLOW FROM ANY STATUS)
# =====================================================
@router.put("/reject-enterprise/{enterprise_id}")
def reject_enterprise(
    enterprise_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "super_admin":
        raise HTTPException(403, "Only super admin can reject enterprise requests")

    try:
        oid = ObjectId(enterprise_id)
    except InvalidId:
        raise HTTPException(400, "Invalid enterprise ID")

    enterprise = users_coll.find_one({
        "_id": oid,
        "user_type": "enterprise"
    })

    if not enterprise:
        raise HTTPException(404, "Enterprise not found")

    users_coll.update_one(
        {"_id": oid},
        {"$set": {
            "approval_status": "rejected",
            "rejected_at": datetime.utcnow(),
            "rejected_by": str(current_user["_id"]),
            "approved_at": None,
            "approved_by": None
        }}
    )

    # 📧 EMAIL
    send_status_email(
        to_email=enterprise["email"],
        username=enterprise.get("username", ""),
        status="rejected",
        enterprise_name=enterprise.get("enterprise", {}).get("name", "")
    )

    return {"message": "Enterprise rejected successfully"}
