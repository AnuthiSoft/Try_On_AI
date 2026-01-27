# seed_roles.py
from db import roles_coll

default_roles = [
    {"name": "super_admin"},
    {"name": "admin"},
    {"name": "enterprise"},
]

for role in default_roles:
    roles_coll.update_one(
        {"name": role["name"]},
        {"$setOnInsert": role},
        upsert=True
    )

print("Roles seeded!")
