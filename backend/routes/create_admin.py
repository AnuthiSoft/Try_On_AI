# routes/create_admin.py
from fastapi import APIRouter, Form, Depends, HTTPException
from db import users_coll, roles_coll
from roles import require_roles
from security import hash_password
from datetime import datetime

router = APIRouter()

@router.post("/create-admin")
def create_admin(
    email: str = Form(...),
    password: str = Form(...),
    current_user=Depends(require_roles(["super_admin"]))
):
    if users_coll.find_one({"email": email}):
        raise HTTPException(400, "Email exists")

    role = roles_coll.find_one({"name": "admin"})

    doc = {
        "email": email,
        "password": hash_password(password),
        "role_id": role["_id"],
        "role_name": "admin",
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }

    res = users_coll.insert_one(doc)
    return {"message": "Admin created", "id": str(res.inserted_id)}
