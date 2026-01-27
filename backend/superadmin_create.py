from datetime import datetime
from bson import ObjectId
from db import users_coll
from security import hash_password

def create_super_admin():
    if users_coll.find_one({"role": "super_admin"}):
        print("Super admin already exists")
        return

    users_coll.insert_one({
        "_id": ObjectId(),
        "role": "super_admin",

        "username": "Super Admin",
        "email": "superadmin@example.com",
        "phone": "0000000000",
        "password": hash_password("SuperAdmin@123"),

        "is_approved": True,
        "email_verified": True,
        "is_active": True,

        "enterprise": None,

        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    print("🚀 Super admin created")

if __name__ == "__main__":
    create_super_admin()
