# routes/create_user.py
from fastapi import APIRouter, Form, Depends, HTTPException
from db import users_coll, roles_coll
from roles import require_roles
from security import hash_password
from datetime import datetime

router = APIRouter()

@router.post("/create-user")
def create_user(
    email: str = Form(...),
    password: str = Form(...),
    current_user=Depends(require_roles(["super_admin", "admin"]))
):
    if users_coll.find_one({"email": email}):
        raise HTTPException(400, "Email exists")

    role = roles_coll.find_one({"name": "user"})

    doc = {
        "email": email,
        "password": hash_password(password),
        "role_id": role["_id"],
        "role_name": "user",
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }

    res = users_coll.insert_one(doc)
    return {"message": "User created", "id": str(res.inserted_id)}
