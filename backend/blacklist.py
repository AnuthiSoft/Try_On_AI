from datetime import datetime
from db import token_blocklist

def blacklist_token(token: str):
    token_blocklist.insert_one({
        "token": token,
        "blacklisted_at": datetime.utcnow()
    })

def is_blacklisted(token: str) -> bool:
    return token_blocklist.find_one({"token": token}) is not None
