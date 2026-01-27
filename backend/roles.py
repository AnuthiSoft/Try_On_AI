from fastapi import Depends, HTTPException, Header, Request
from typing import Optional
from bson import ObjectId
from jwt_utils import decode_access_token
from db import users_coll


def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")

    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(401, "Invalid or expired token")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(401, "Invalid token payload")

    user = users_coll.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(401, "User not found")

    return user


def require_roles(allowed_roles: list[str]):
    def checker(current_user=Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(403, "Not allowed")
        return current_user
    return checker
