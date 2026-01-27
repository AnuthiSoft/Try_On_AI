from fastapi import APIRouter, Header, HTTPException, status
from typing import Optional
from blacklist import blacklist_token   # <-- FIXED IMPORT

router = APIRouter()

@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Invalidate JWT token by blacklisting it."""
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Authorization header"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization header must start with 'Bearer '"
        )

    token = authorization.split(" ", 1)[1].strip()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token not found"
        )

    # Add token to blacklist
    blacklist_token(token)

    return {"message": "Logged out successfully"}
