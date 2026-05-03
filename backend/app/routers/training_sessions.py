"""
Training sessions routes for CRUD operations.

Provides endpoints for:
    - Creating new training sessions
    - Retrieving user's training sessions with pagination
    - Getting specific training session details
    - Updating session results (parameters, loss, metrics)
    - Deleting training sessions
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from app.models.orm import TrainingSession, User
from app.models.schemas import (
    TrainingSessionCreate,
    TrainingSessionUpdate,
    TrainingSessionResponse
)
from app.utils.jwt_utils import get_current_user

router = APIRouter(
    prefix="/api/training-sessions",
    tags=["training-sessions"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"}
    }
)


@router.post("", response_model=TrainingSessionResponse)
async def create_training_session(
    session_create: TrainingSessionCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainingSessionResponse:
    """
    Create a new training session.

    Starts a new machine learning training session for the authenticated user.

    Args:
        session_create: Training session data
        user_id: Authenticated user ID (from JWT)
        db: Database session (injected)

    Returns:
        Created TrainingSessionResponse with generated ID

    Example:
        POST /api/training-sessions
        {
            "algorithm_type": "linear_regression",
            "dataset": [{"x": 1.0, "y": 2.5}, ...],
            "hyperparameters": {"learning_rate": 0.01, "epochs": 50}
        }

        Response: TrainingSessionResponse
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Create new training session
    new_session = TrainingSession(
        user_id=user_id,
        algorithm_type=session_create.algorithm_type,
        dataset=session_create.dataset,
        hyperparameters=session_create.hyperparameters
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return TrainingSessionResponse.model_validate(new_session)


@router.get("", response_model=dict)
async def get_training_sessions(
    user_id: int = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
) -> dict:
    """
    Get paginated list of user's training sessions.

    Retrieves all training sessions for the authenticated user,
    sorted by creation date (newest first) with pagination support.

    Args:
        user_id: Authenticated user ID (from JWT)
        skip: Number of sessions to skip (default: 0)
        limit: Maximum sessions to return (default: 10, max: 100)
        db: Database session (injected)

    Returns:
        Dictionary with sessions list and total count

    Example:
        GET /api/training-sessions?skip=0&limit=10

        Response:
        {
            "sessions": [TrainingSessionResponse, ...],
            "total": 25
        }
    """
    # Count total sessions for user
    total = db.query(TrainingSession).filter(
        TrainingSession.user_id == user_id
    ).count()

    # Query sessions with pagination, sorted by created_at descending
    sessions = db.query(TrainingSession).filter(
        TrainingSession.user_id == user_id
    ).order_by(
        TrainingSession.created_at.desc()
    ).offset(skip).limit(limit).all()

    return {
        "sessions": [
            TrainingSessionResponse.model_validate(s) for s in sessions
        ],
        "total": total
    }


@router.get("/{session_id}", response_model=TrainingSessionResponse)
async def get_training_session(
    session_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainingSessionResponse:
    """
    Get specific training session details.

    Retrieves a single training session by ID.
    User can only access their own sessions.

    Args:
        session_id: Training session ID
        user_id: Authenticated user ID (from JWT)
        db: Database session (injected)

    Returns:
        TrainingSessionResponse with full session data

    Raises:
        HTTPException: 404 if session not found
        HTTPException: 403 if session doesn't belong to user

    Example:
        GET /api/training-sessions/1
    """
    session = db.query(TrainingSession).filter(
        TrainingSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        )

    # Verify ownership
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this session"
        )

    return TrainingSessionResponse.model_validate(session)


@router.put("/{session_id}", response_model=TrainingSessionResponse)
async def update_training_session(
    session_id: int,
    session_update: TrainingSessionUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainingSessionResponse:
    """
    Update training session with results.

    Updates session with model parameters, loss history, and metrics
    after training completes. Automatically updates the updated_at timestamp.

    Args:
        session_id: Training session ID
        session_update: Update data (model_parameters, loss_history, metrics)
        user_id: Authenticated user ID (from JWT)
        db: Database session (injected)

    Returns:
        Updated TrainingSessionResponse

    Raises:
        HTTPException: 404 if session not found
        HTTPException: 403 if session doesn't belong to user

    Example:
        PUT /api/training-sessions/1
        {
            "model_parameters": {"weights": [1.2, 0.5], "bias": 0.3},
            "loss_history": [0.5, 0.45, 0.42],
            "metrics": {"mse": 0.02, "r2": 0.95}
        }
    """
    session = db.query(TrainingSession).filter(
        TrainingSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        )

    # Verify ownership
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this session"
        )

    # Update fields if provided
    if session_update.model_parameters is not None:
        session.model_parameters = session_update.model_parameters

    if session_update.loss_history is not None:
        session.loss_history = session_update.loss_history

    if session_update.metrics is not None:
        session.metrics = session_update.metrics

    # updated_at is automatically set by SQLAlchemy
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return TrainingSessionResponse.model_validate(session)


@router.delete("/{session_id}", response_model=dict)
async def delete_training_session(
    session_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Delete a training session.

    Permanently removes a training session and all associated data.
    User can only delete their own sessions.

    Args:
        session_id: Training session ID
        user_id: Authenticated user ID (from JWT)
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException: 404 if session not found
        HTTPException: 403 if session doesn't belong to user

    Example:
        DELETE /api/training-sessions/1

        Response:
        {"message": "Training session deleted successfully"}
    """
    session = db.query(TrainingSession).filter(
        TrainingSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        )

    # Verify ownership
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this session"
        )

    # Delete session
    db.delete(session)
    db.commit()

    return {"message": "Training session deleted successfully"}
