"""Authentication Dependencies for FastAPI"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db, User
from .jwt_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v5.1/auth/token", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user (optional)"""
    if not token:
        return None
    
    payload = decode_access_token(token)
    if payload is None:
        return None
    
    username: str = payload.get("sub")
    if username is None:
        return None
    
    user = db.query(User).filter(User.username == username).first()
    return user

async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require active authenticated user"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require superuser privileges"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user
