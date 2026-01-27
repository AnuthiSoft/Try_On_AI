from fastapi import APIRouter, Form, HTTPException
from bson import ObjectId

from db import users_coll
from security import verify_password
from jwt_utils import create_access_token

router = APIRouter()


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...)
):
    # 🔍 FIND USER
    user = users_coll.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 🔐 VERIFY PASSWORD
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 🔒 EMAIL VERIFIED CHECK
    if not user.get("email_verified", False):
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please verify your email first."
        )

    # 🔒 ACCOUNT ACTIVE CHECK
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=403,
            detail="Account is disabled. Contact support."
        )

    # 🔒 ENTERPRISE APPROVAL CHECK (FIXED)
    if user.get("user_type") == "enterprise":
        if user.get("approval_status") != "approved":
            raise HTTPException(
                status_code=403,
                detail="Enterprise account pending approval."
            )

    # 🔑 ROLE (AUTHORIZATION PURPOSE)
    role = user.get("role", "user")

    # 🔐 JWT PAYLOAD
    payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "role": role,
        "user_type": user.get("user_type")
    }

    access_token = create_access_token(payload)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "role": role,
        "user_type": user.get("user_type"),
        "user_id": str(user["_id"])
    }   
