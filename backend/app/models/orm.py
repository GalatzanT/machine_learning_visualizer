"""
SQLAlchemy ORM models for the machine learning application.

Contains:
    - User: User account model with password hashing
    - TrainingSession: Machine learning model training records
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
from database import Base


class User(Base):
    """
    User account model.
    
    Stores user credentials and account information with password hashing
    using bcrypt for security.
    
    Attributes:
        id: Unique user identifier (Primary Key)
        email: User email address (unique, required)
        username: User username (unique, required)
        password_hash: Hashed password using bcrypt
        created_at: Account creation timestamp
        training_sessions: Relationship to user's training sessions
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to training sessions
    training_sessions = relationship(
        "TrainingSession",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    def set_password(self, password: str) -> None:
        """
        Hash and set user password using bcrypt.
        
        The password is hashed with bcrypt salt rounds (12) for security.
        
        Args:
            password: Plain text password to hash
            
        Example:
            user = User(email="user@example.com", username="john")
            user.set_password("mySecurePassword123")
        """
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            salt
        ).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """
        Verify plain text password against stored hash.
        
        Uses bcrypt's checkpw to safely compare passwords.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            True if password matches, False otherwise
            
        Example:
            user = User.query.filter_by(username="john").first()
            if user.verify_password("mySecurePassword123"):
                # Login successful
                pass
        """
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )
    
    def __repr__(self) -> str:
        """String representation of User."""
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"


class TrainingSession(Base):
    """
    Machine learning model training session record.
    
    Stores complete information about a training session including:
    - Model type and hyperparameters
    - Training data and results
    - Model parameters and performance metrics
    - Loss evolution across epochs
    
    Attributes:
        id: Unique session identifier (Primary Key)
        user_id: Foreign key to User
        algorithm_type: Type of ML algorithm used
        dataset: Training data as list of dicts
        hyperparameters: Training configuration
        model_parameters: Trained model weights and bias
        loss_history: Loss values across epochs
        metrics: Performance metrics (MSE, R2, accuracy, etc.)
        created_at: Session creation timestamp
        updated_at: Last update timestamp
        user: Relationship to User
    """
    
    __tablename__ = "training_sessions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    algorithm_type = Column(String(50), nullable=False)
    dataset = Column(JSON, nullable=False)
    hyperparameters = Column(JSON, nullable=False)
    model_parameters = Column(JSON, nullable=True)
    loss_history = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationship to user
    user = relationship("User", back_populates="training_sessions", lazy="select")
    
    def __repr__(self) -> str:
        """String representation of TrainingSession."""
        return (
            f"<TrainingSession(id={self.id}, user_id={self.user_id}, "
            f"algorithm_type='{self.algorithm_type}')>"
        )
