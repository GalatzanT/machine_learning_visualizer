"""
Pydantic schemas pentru request/response models
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class DatasetUploadResponse(BaseModel):
    message: str
    num_points: int
    x_range: tuple
    y_range: tuple
    x_values: List[float]
    y_values: List[float]


class DatasetGenerateRequest(BaseModel):
    dataset_type: str = "simple"  # simple, noisy, outliers
    num_points: int = 20
    noise_level: float = 1.0
    seed: Optional[int] = None


class DatasetInfoResponse(BaseModel):
    num_points: int
    x_range: tuple
    y_range: tuple
    x_mean: float
    y_mean: float
    is_loaded: bool


class PointStepResponse(BaseModel):
    """Response pentru procesarea unui singur punct."""
    point_index: int
    total_points: int
    x_value: float
    y_actual: float
    y_predicted: float
    error: float
    contribution_w: float
    contribution_b: float
    accumulated_gradient_w: float
    accumulated_gradient_b: float
    is_last_point: bool
    w_current: float
    b_current: float
    w_new: Optional[float] = None  # Doar la ultimul punct
    b_new: Optional[float] = None  # Doar la ultimul punct
    explanation: str
    error_categories: Optional[List[str]] = None  # Doar la ultimul punct
    error_magnitudes: Optional[List[float]] = None  # Doar la ultimul punct
    epoch: Optional[int] = None  # Doar la ultimul punct
    explanations: Optional[List[str]] = None  # Doar la ultimul punct - explicații detaliate


class LearningRateConfig(BaseModel):
    learning_rate: float


class GradientStepResponse(BaseModel):
    epoch: int
    
    # Parametri
    w_before: float
    b_before: float
    w_after: float
    b_after: float
    delta_w: float
    delta_b: float
    
    # Gradienți
    gradient_w: float
    gradient_b: float
    gradient_magnitude: float
    
    # Loss
    loss_before: float
    loss_after: float
    loss_delta: float
    loss_history: List[float]
    
    # Erori per punct
    errors: List[float]
    error_magnitudes: List[float]
    error_categories: List[str]
    
    # Contribuții
    contributions: dict
    
    # Predicții
    predictions_before: List[float]
    predictions_after: List[float]
    
    # Explicații
    explanations: List[str]
    
    # Learning rate info
    learning_rate: float
    step_size: float


# ============================================================================
# User Authentication Schemas
# ============================================================================

class UserCreate(BaseModel):
    """
    Schema for creating a new user account.
    
    Used for registration requests.
    """
    email: str
    username: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "john_doe",
                "password": "SecurePassword123!"
            }
        }


class UserResponse(BaseModel):
    """
    Schema for user response data.
    
    Used for API responses, excludes sensitive information like password.
    """
    id: int
    email: str
    username: str
    created_at: datetime  # DateTime object (auto-serialized to ISO format in JSON)
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    """
    Schema for user login request.
    """
    email: str
    password: str


# ============================================================================
# Training Session Schemas
# ============================================================================

class TrainingSessionCreate(BaseModel):
    """
    Schema for creating a new training session.
    
    Used when starting a new model training.
    """
    name: Optional[str] = None
    algorithm_type: str  # linear_regression, logistic_regression, knn, svm, decision_tree
    dataset: List[dict]  # List of {x: float, y: float}
    hyperparameters: dict  # {learning_rate: 0.01, epochs: 50, k: 5, etc.}
    model_parameters: Optional[dict] = None
    loss_history: Optional[List[float]] = None
    metrics: Optional[dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "algorithm_type": "linear_regression",
                "dataset": [
                    {"x": 1.0, "y": 2.5},
                    {"x": 2.0, "y": 4.8},
                    {"x": 3.0, "y": 6.9}
                ],
                "hyperparameters": {
                    "learning_rate": 0.01,
                    "epochs": 50
                }
            }
        }


class TrainingSessionUpdate(BaseModel):
    """
    Schema for updating training session results.
    
    Used after training completes to store results.
    """
    model_parameters: Optional[dict] = None  # {weights: [...], bias: 0.5}
    loss_history: Optional[List[float]] = None  # [0.5, 0.45, 0.42, ...]
    metrics: Optional[dict] = None  # {mse: 0.02, r2: 0.95, accuracy: 0.92}


class TrainingSessionResponse(BaseModel):
    """
    Schema for training session response.
    
    Complete training session information for API responses.
    """
    id: int
    user_id: int
    name: Optional[str] = None
    algorithm_type: str
    dataset: List[dict]
    hyperparameters: dict
    model_parameters: Optional[dict] = None
    loss_history: Optional[List[float]] = None
    metrics: Optional[dict] = None
    created_at: datetime  # DateTime object (auto-serialized to ISO format in JSON)
    updated_at: datetime  # DateTime object (auto-serialized to ISO format in JSON)
    user: Optional[UserResponse] = None  # Nested user data
    
    model_config = ConfigDict(from_attributes=True)


class FreezeStateResponse(BaseModel):
    model: dict
    loss: float
    gradient: dict
    mse_breakdown: dict
    gradient_breakdown: dict
    predictions: List[float]
    errors: List[float]
    contributions: dict
    epoch: int


class LearningRateResponse(BaseModel):
    learning_rate: float
    warnings: List[str]
    status: str