# jwt_utils.py
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import os
from blacklist import is_blacklisted


# =============================
# CONFIG
# =============================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-this")
ALGORITHM = "HS256"
DEFAULT_EXPIRES_HOURS = 6
 
# =============================
# CREATE TOKEN
# =============================
def create_access_token(
    data: dict,
    expires_hours: int = DEFAULT_EXPIRES_HOURS
) -> str:
    """
    Create JWT access token.
    Data should include: user_id, email, role
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=expires_hours)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# =============================
# INTERNAL HELPER
# =============================
def _strip_bearer(token: Optional[str]) -> Optional[str]:
    if not token:
        return None

    token = token.strip()
    if token.lower().startswith("bearer "):
        return token.split(" ", 1)[1].strip()

    return token

# =============================
# DECODE TOKEN
# =============================
def decode_access_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None

    #  STRIP "Bearer "
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1]

    #  BLOCK LOGGED-OUT TOKENS
    if is_blacklisted(token):
        return None

    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None