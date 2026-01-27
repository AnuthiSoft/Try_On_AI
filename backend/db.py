import os
from pymongo import MongoClient
from dotenv import load_dotenv

# =========================
# LOAD ENV
# =========================
load_dotenv()

# =========================
# CONFIG (ONLY TWO VARS)
# =========================
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("AUTH_DB_NAME")

# =========================
# SAFETY CHECKS
# =========================
if not MONGO_URI:
    raise RuntimeError("❌ MONGO_URI missing in .env")

if not DB_NAME:
    raise RuntimeError("❌ AUTH_DB_NAME missing in .env")

if not (
    MONGO_URI.startswith("mongodb://")
    or MONGO_URI.startswith("mongodb+srv://")
):
    raise RuntimeError(f"❌ Invalid MONGO_URI: {MONGO_URI}")

print("🔹 Connecting to MongoDB Atlas:", MONGO_URI)

# =========================
# CONNECTION
# =========================
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
client.admin.command("ping")

db = client[DB_NAME]

print(f"✅ MongoDB connected | DB = {DB_NAME}")

# =========================
# COLLECTIONS (ALL IN SAME DB)
# =========================
users_coll = db["users"]
roles_coll = db["roles"]
token_blocklist = db["token_blocklist"]
otp_coll = db["email_otps"]
wallets_coll = db["wallets"]
transactions_coll = db["transactions"]

image_pricing_coll = db["image_pricing"]
jobs_coll = db["image_jobs"]
virtual_tryon_jobs=db["virtual_tryon_jobs"]
image_pricing_coll = db["image_pricing"]

# ✅ ADD THIS LINE
image_type_selection_coll = db["image_type_selection"]