"""
JWT token management utilities for secure user authentication.

Handles token creation, verification, and extraction of user information
from JWT tokens using HS256 algorithm.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration constants
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "your-super-secret-key-change-in-production"
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

# Security scheme for OpenAPI documentation
security = HTTPBearer()


def create_access_token(
    user_id: int,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for user authentication.

    Args:
        user_id: Unique user identifier to encode in token
        expires_delta: Custom expiration time. If None, uses default (7 days)

    Returns:
        Encoded JWT token as string

    Raises:
        ValueError: If user_id is invalid

    Example:
        token = create_access_token(user_id=1)
        token_with_custom_expiry = create_access_token(
            user_id=1,
            expires_delta=timedelta(hours=24)
        )
    """
    if user_id <= 0:
        raise ValueError("user_id must be a positive integer")

    # Set expiration time
    if expires_delta is None:
        expires_delta = timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    # Calculate expiration timestamp
    expire = datetime.utcnow() + expires_delta

    # Create token payload
    to_encode: Dict = {
        "user_id": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }

    # Encode and return token
    encoded_jwt = jwt.encode(
        to_encode,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> Dict[str, int]:
    """
    Verify and decode JWT token.

    Validates token signature and expiration, then extracts payload.

    Args:
        token: JWT token string to verify

    Returns:
        Dictionary containing token payload with user_id

    Raises:
        HTTPException: 401 if token is invalid, expired, or malformed

    Example:
        payload = verify_token(token="eyJhbGc...")
        user_id = payload["user_id"]
    """
    try:
        # Decode and verify token
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        user_id: int = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id"
            )

        return {"user_id": user_id}

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


def get_current_user(
    credentials = Depends(security)
) -> int:
    """
    FastAPI dependency to extract current user from request.

    Extracts and verifies JWT token from Authorization header,
    then returns authenticated user's ID.

    Use as dependency in protected endpoints:
        @app.get("/protected")
        def protected_route(user_id: int = Depends(get_current_user)):
            ...

    Args:
        credentials: HTTPBearer credentials from request header

    Returns:
        User ID (int) from verified token

    Raises:
        HTTPException: 401 if token missing, invalid, or expired

    Example:
        @app.get("/profile")
        def get_profile(user_id: int = Depends(get_current_user)):
            # user_id is guaranteed to be valid and authenticated
            return db.query(User).filter(User.id == user_id).first()
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials"
        )

    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    return user_id
