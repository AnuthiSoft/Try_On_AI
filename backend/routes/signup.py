from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
import random
import re

from security import hash_password
from db import users_coll, otp_coll
from services.wallet_service import create_wallet_for_user
from utils.email_signup_otp import send_email_otp

router = APIRouter(prefix="/auth", tags=["Auth"])


# =========================
# REQUEST MODELS
# =========================

class SendOtpRequest(BaseModel):
    email: EmailStr
    purpose: str  # signup | reset_password


class SignupRequest(BaseModel):
    user_type: str
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    phone: str
    otp: str
    enterprise_name: Optional[str] = None
    location: Optional[str] = None

    @validator("user_type")
    def validate_user_type(cls, v):
        if v not in {"normal", "enterprise"}:
            raise ValueError("user_type must be normal or enterprise")
        return v

    @validator("password")
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(re.findall(r"[a-z]", v)) < 4:
            raise ValueError("At least 4 lowercase letters required")
        if not re.search(r"[A-Z]", v):
            raise ValueError("At least 1 uppercase letter required")
        if len(re.findall(r"[0-9]", v)) < 3:
            raise ValueError("At least 3 digits required")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("At least 1 special character required")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if v != values.get("password"):
            raise ValueError("Passwords do not match")
        return v

    @validator("enterprise_name", "location", always=True)
    def enterprise_required(cls, v, values):
        if values.get("user_type") == "enterprise" and not v:
            raise ValueError("Required for enterprise users")
        return v


class ResetPasswordConfirmRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if v != values.get("new_password"):
            raise ValueError("Passwords do not match")
        return v


# =========================
# SEND OTP (SIGNUP / RESET)
# =========================

@router.post("/send-otp")
def send_otp(payload: SendOtpRequest):

    if payload.purpose not in {"signup", "reset_password"}:
        raise HTTPException(status_code=400, detail="Invalid OTP purpose")

    if payload.purpose == "signup" and users_coll.find_one({"email": payload.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if payload.purpose == "reset_password" and not users_coll.find_one({"email": payload.email}):
        raise HTTPException(status_code=404, detail="User not found")

    otp = str(random.randint(100000, 999999))

    # Invalidate previous OTPs
    otp_coll.update_many(
        {"email": payload.email, "purpose": payload.purpose, "verified": False},
        {"$set": {"verified": True}}
    )

    otp_coll.insert_one({
        "_id": ObjectId(),
        "email": payload.email,
        "otp": otp,
        "purpose": payload.purpose,
        "verified": False,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    })

    send_email_otp(payload.email, otp, payload.purpose)

    return {"message": "OTP sent successfully"}


# =========================
# SIGNUP
# =========================

@router.post("/signup")
def signup(payload: SignupRequest):

    otp_doc = otp_coll.find_one(
        {
            "email": payload.email,
            "purpose": "signup",
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()}
        },
        sort=[("created_at", -1)]
    )

    if not otp_doc or otp_doc["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp_coll.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"verified": True}}
    )

    role = "user" if payload.user_type == "normal" else "enterprise"

    user_doc = {
        "_id": ObjectId(),
        "role": role,
        "user_type": payload.user_type,
        "approval_status": "approved" if payload.user_type == "normal" else "pending",
        "username": payload.username,
        "email": payload.email,
        "phone": payload.phone,
        "password": hash_password(payload.password),
        "email_verified": True,
        "is_active": True,
        "enterprise": {
            "name": payload.enterprise_name,
            "location": payload.location
        } if payload.user_type == "enterprise" else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    users_coll.insert_one(user_doc)
    create_wallet_for_user(str(user_doc["_id"]), payload.user_type)

    return {"message": "Signup successful"}


# =========================
# RESET PASSWORD CONFIRM
# =========================

@router.post("/reset-password/confirm")
def reset_password(payload: ResetPasswordConfirmRequest):

    otp_doc = otp_coll.find_one(
        {
            "email": payload.email,
            "purpose": "reset_password",
            "verified": False,
            "expires_at": {"$gt": datetime.utcnow()}
        },
        sort=[("created_at", -1)]
    )

    if not otp_doc or otp_doc["otp"] != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    users_coll.update_one(
        {"email": payload.email},
        {"$set": {
            "password": hash_password(payload.new_password),
            "updated_at": datetime.utcnow()
        }}
    )

    otp_coll.update_one(
        {"_id": otp_doc["_id"]},
        {"$set": {"verified": True}}
    )

    return {"message": "Password reset successful"}
