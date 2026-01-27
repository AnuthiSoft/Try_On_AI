# =========================
# 🔥 REQUIRED ADDITION (DO NOT REMOVE)
# =========================
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)
# =========================
# 🔥 END REQUIRED ADDITION
# =========================


# =========================
# CORE FASTAPI
# =========================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


# =========================
# AUTH ROUTES
# =========================

from routes.signup import router as signup_router
from routes.login import router as login_router
from routes.logout import router as logout_router
from routes.create_admin import router as admin_router
from routes.create_user import router as user_router


# =========================
# ADMIN / ENTERPRISE
# =========================
from routes.admin_enterprise_approval import router as enterprise_approval_router
from routes.superadmin_image_pricing import router as superadmin_pricing_router



# =========================
# MODEL / IMAGE ROUTES
# =========================
from routes.model_generation import (
    router as model_generation_router,
    image_router as image_legacy_router
)
from routes.image_gallery import router as image_gallery_router
from user_images import router as user_images_router
from virtual_try_on import router as virtual_tryon_router
from routes.image_gallery import router as model_images_router
from routes.image_resize import router as image_resize_router

# =========================
# WALLET / PAYMENTS
# =========================
from routes.wallet import router as wallet_router
from routes.payments import router as payment_router
from routes.image_pricing_public import router as pricing_user_router



# =========================
# APP INIT
# =========================
app = FastAPI(title="Virtual Try-On Main API")


# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later if needed
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# REGISTER API ROUTES (APIs FIRST — IMPORTANT)
# =========================

# ---- AUTH ----

app.include_router(signup_router, prefix="/api")
app.include_router(login_router, prefix="/api/auth")
app.include_router(logout_router, prefix="/api/auth")

# ---- ADMIN / ENTERPRISE ----
app.include_router(admin_router, prefix="/api/auth")
app.include_router(user_router, prefix="/api/auth")
app.include_router(enterprise_approval_router, prefix="/api/auth")

# ---- MODEL / IMAGE GENERATION ----
app.include_router(model_generation_router, prefix="/api/auth")
app.include_router(image_legacy_router, prefix="/api/auth")
app.include_router(image_gallery_router, prefix="/api/auth")
app.include_router(model_images_router, prefix="/api")
app.include_router(image_resize_router)

# ---- USER IMAGES ----
app.include_router(user_images_router, prefix="/api/user-images")

# ---- VIRTUAL TRY-ON ----
app.include_router(virtual_tryon_router, prefix="/api/tryon")

# ---- WALLET / PAYMENTS ----
app.include_router(wallet_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(superadmin_pricing_router) 
app.include_router(pricing_user_router) 

# # =========================
# # REACT STATIC FILES
# # =========================
# STATIC_DIR = os.path.join(BASE_DIR, "static")

# # Serve React build assets
# app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# =========================
# ROOT (Azure health + initial load)
# =========================
# @app.get("/")
# def serve_root():
#     return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# =========================
# SPA CATCH-ALL (CRITICAL FIX)
# =========================
# This makes browser refresh work on ANY React route
# @app.get("/{full_path:path}")
# def serve_spa(full_path: str):
#     return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# =========================
# DEBUG ROUTE (OPTIONAL)
# =========================
@app.get("/__routes")
def list_routes():  
    return [
        {"path": r.path, "methods": list(getattr(r, "methods", []))}
        for r in app.router.routes
    ]


# =========================
# LOCAL RUN
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)  
