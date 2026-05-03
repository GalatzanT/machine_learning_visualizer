"""
Database configuration and setup using SQLAlchemy.

Handles SQLite database connection, session management, and model
initialization.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator

# Database URL - SQLite local file
DATABASE_URL = "sqlite:///./ml_app.db"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite specific
    echo=False  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency function for FastAPI endpoints to get database session.
    
    Yields:
        SessionLocal: Database session for the request
        
    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables defined in models.
    
    Should be called once when application starts.
    Creates all tables that inherit from Base.
    
    Example:
        from database import init_db
        init_db()  # Creates all tables in ml_app.db
    """
    Base.metadata.create_all(bind=engine)
