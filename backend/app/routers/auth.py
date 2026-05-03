"""
Authentication routes for user registration and login.

Provides endpoints for:
    - User registration with email and password
    - User login with credentials
    - User logout (placeholder for JWT-based auth)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.orm import User
from app.models.schemas import (
    UserCreate,
    UserLogin,
    UserResponse
)
from app.utils.jwt_utils import create_access_token

router = APIRouter(
    prefix="",
    tags=["auth"],
    responses={400: {"description": "Bad request"}}
)


@router.post("/register", response_model=dict)
async def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
) -> dict:
    """
    Register a new user account.

    Creates a new user with email, username, and hashed password.
    Validates that email and username are unique.

    Args:
        user_create: Registration data (email, username, password)
        db: Database session (injected)

    Returns:
        Dictionary with user info and success message

    Raises:
        HTTPException: 400 if email or username already exists

    Example:
        {
            "user": {
                "id": 1,
                "email": "user@example.com",
                "username": "john_doe",
                "created_at": "2024-05-03T10:30:00"
            },
            "message": "User registered successfully"
        }
    """
    # Check if email already exists
    existing_email = db.query(User).filter(
        User.email == user_create.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing_username = db.query(User).filter(
        User.username == user_create.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    new_user = User(
        email=user_create.email,
        username=user_create.username
    )

    # Hash and set password using bcrypt
    new_user.set_password(user_create.password)

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return response
    return {
        "user": UserResponse.model_validate(new_user),
        "message": "User registered successfully"
    }


@router.post("/login", response_model=dict)
async def login(
    user_login: UserLogin,
    db: Session = Depends(get_db)
) -> dict:
    """
    Authenticate user and return JWT access token.

    Verifies email and password, generates JWT token if valid.

    Args:
        user_login: Login credentials (email, password)
        db: Database session (injected)

    Returns:
        Dictionary with access token and user information

    Raises:
        HTTPException: 401 if email not found or password incorrect

    Example:
        {
            "access_token": "eyJhbGciOiJIUzI1NiIs...",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "username": "john_doe",
                "created_at": "2024-05-03T10:30:00"
            }
        }
    """
    # Find user by email
    user = db.query(User).filter(
        User.email == user_login.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not user.verify_password(user_login.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token(user_id=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/logout", response_model=dict)
async def logout() -> dict:
    """
    Logout user (placeholder endpoint).

    With JWT tokens, logout is handled client-side by discarding the token.
    This endpoint is a placeholder for consistency.

    Returns:
        Success message

    Example:
        {"message": "Logged out successfully"}
    """
    return {"message": "Logged out successfully"}
