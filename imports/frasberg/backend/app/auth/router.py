"""Authentication Router for v5.1"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional

from backend.app.database import get_db, User
from .jwt_handler import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    refresh_access_token,
    generate_api_key,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .dependencies import get_current_active_user, get_current_superuser

router = APIRouter(prefix="/api/v5.1/auth", tags=["authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_in: int

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_enterprise: bool
    total_requests: int
    total_tokens: int
    
    class Config:
        from_attributes = True

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    include_refresh: bool = True
):
    """Login and get access token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
    
    if include_refresh:
        response["refresh_token"] = create_refresh_token(data={"sub": user.username})
    
    return response

@router.post("/refresh", response_model=Token)
def refresh(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    new_access_token = refresh_access_token(request.refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info"""
    return current_user

@router.post("/api-key")
def create_api_key(
    name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new API key for current user"""
    from backend.app.database.models import APIKey
    
    api_key, key_hash = generate_api_key()
    
    db_api_key = APIKey(
        user_id=current_user.id,
        key_hash=key_hash,
        key_prefix=api_key[:15],  # Store prefix for identification
        name=name,
        scopes=["read", "write"]  # Default scopes
    )
    db.add(db_api_key)
    db.commit()
    
    return {
        "api_key": api_key,  # Only shown once!
        "name": name,
        "prefix": api_key[:15],
        "scopes": ["read", "write"],
        "warning": "Store this key securely. It won't be shown again."
    }

@router.get("/health")
def auth_health():
    """Authentication service health check"""
    from .jwt_handler import JWT_AVAILABLE
    
    return {
        "status": "healthy",
        "jwt_available": JWT_AVAILABLE,
        "mode": "production" if JWT_AVAILABLE else "development"
    }
