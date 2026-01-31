"""
Pydantic schemas pentru request/response models
"""
from pydantic import BaseModel
from typing import List, Optional


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
