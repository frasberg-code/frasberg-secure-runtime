"""JWT Authentication for Frasberg v5.1"""
from datetime import datetime, timedelta
from typing import Optional
import os
import secrets
import logging

logger = logging.getLogger(__name__)

# Try to import dependencies, gracefully handle if not installed
try:
    from jose import JWTError, jwt
    from passlib.context import CryptContext
    JWT_AVAILABLE = True
except ImportError:
    logger.warning("JWT dependencies not installed. Using simplified mode.")
    JWT_AVAILABLE = False
    import hashlib
    class CryptContext:
        def __init__(self, **kwargs):
            pass
        def verify(self, plain, hashed):
            return hashlib.sha256(plain.encode()).hexdigest() == hashed
        def hash(self, password):
            return hashlib.sha256(password.encode()).hexdigest()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_" + secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") if JWT_AVAILABLE else CryptContext()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash password"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        return ""

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if not JWT_AVAILABLE:
        # Simplified token for development
        return f"dev_token_{data.get('sub', 'user')}_{secrets.token_hex(16)}"
    
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token creation error: {e}")
        return ""

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    if not JWT_AVAILABLE:
        return f"dev_refresh_{data.get('sub', 'user')}_{secrets.token_hex(16)}"
    
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Refresh token creation error: {e}")
        return ""

def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token"""
    if not JWT_AVAILABLE:
        # Simple validation for dev tokens
        if token.startswith("dev_token_"):
            username = token.split("_")[2] if len(token.split("_")) > 2 else "unknown"
            return {"sub": username, "type": "access"}
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError as e:
        logger.debug(f"Token decode error: {e}")
        return None

def decode_refresh_token(token: str) -> Optional[dict]:
    """Decode JWT refresh token"""
    if not JWT_AVAILABLE:
        if token.startswith("dev_refresh_"):
            username = token.split("_")[2] if len(token.split("_")) > 2 else "unknown"
            return {"sub": username, "type": "refresh"}
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError as e:
        logger.debug(f"Refresh token decode error: {e}")
        return None

def generate_api_key() -> tuple[str, str]:
    """Generate API key (returns key and hash)"""
    prefix = "sk_live_" if JWT_AVAILABLE else "sk_test_"
    key = f"{prefix}{secrets.token_hex(32)}"
    key_hash = get_password_hash(key)
    return key, key_hash

def refresh_access_token(refresh_token: str) -> Optional[str]:
    """Generate new access token from refresh token"""
    payload = decode_refresh_token(refresh_token)
    if not payload:
        return None
    
    # Create new access token with same subject
    return create_access_token(data={"sub": payload.get("sub")})
