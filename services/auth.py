import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ecovision-jwt-secret-key-2026-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def hash_password(password: str) -> str:
    """Hashes a password with PBKDF2-HMAC-SHA256 and a random cryptographic salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${dk.hex()}"

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verifies a plain-text password against a stored salt$hash string."""
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        salt, stored_hash = hashed_password.split("$", 1)
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(dk.hex(), stored_hash)
    except Exception:
        return False

def create_access_token(user_id: int, username: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT token for the authenticated user session."""
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token; returns payload dict or None if invalid/expired."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
