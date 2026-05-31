from typing import Dict, List, Optional

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.utils.jwt_utils import get_current_user
from database import get_db

router = APIRouter(prefix="/api/logistic-training", tags=["logistic-training"])


class StartTrainingRequest(BaseModel):
    dataset: Dict[str, List[float]]
    learning_rate: float = 0.01


class LogisticRegression:
    def __init__(self, learning_rate: float = 0.01):
        self.w = 1.0
        self.b = 1.0
        self.learning_rate = learning_rate

    def sigmoid(self, z: np.ndarray | float) -> np.ndarray | float:
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

    def predict_proba(self, x: np.ndarray | float) -> np.ndarray | float:
        z = self.w * x + self.b
        return self.sigmoid(z)

    def bce_loss(self, x_data: np.ndarray, y_data: np.ndarray) -> float:
        predictions = self.predict_proba(x_data)
        predictions = np.clip(predictions, 1e-7, 1 - 1e-7)
        loss = -np.mean(
            y_data * np.log(predictions)
            + (1 - y_data) * np.log(1 - predictions)
        )
        return float(loss)

    def gradient_step(self, x: float, y: int) -> Dict[str, float]:
        pred = float(self.predict_proba(x))
        error = pred - float(y)

        grad_w = error * x
        grad_b = error

        self.w -= self.learning_rate * grad_w
        self.b -= self.learning_rate * grad_b

        sample_loss = -(
            y * np.log(np.clip(pred, 1e-7, 1 - 1e-7))
            + (1 - y) * np.log(np.clip(1 - pred, 1e-7, 1 - 1e-7))
        )

        return {
            "error": float(error),
            "prediction": float(pred),
            "grad_w": float(grad_w),
            "grad_b": float(grad_b),
            "loss": float(sample_loss),
        }


_current_session: Optional[Dict] = None


def calculate_epoch_summary(session: Dict, epoch_num: int) -> Dict:
    """Calculate summary statistics for completed epoch."""
    x_data = session["x_data"]
    y_data = session["y_data"]
    model = session["model"]
    total_samples = len(x_data)
    
    # Predictions for all samples
    predictions = np.array([float(model.predict_proba(x)) for x in x_data])
    
    # Get class distribution
    class_0_count = int(np.sum(y_data == 0))
    class_1_count = int(np.sum(y_data == 1))
    majority_class = 1 if class_1_count > class_0_count else 0
    majority_count = max(class_0_count, class_1_count)
    
    # Calculate errors for all samples
    errors = np.abs(predictions - y_data)
    hardest_point_idx = int(np.argmax(errors))
    hardest_error = float(errors[hardest_point_idx])
    
    # Average loss for this epoch (last total_samples entries)
    epoch_losses = session["loss_history"][-total_samples:]
    avg_loss = float(np.mean(epoch_losses))
    
    # Previous epoch average (if exists)
    prev_avg_loss = avg_loss
    if epoch_num > 1 and len(session["loss_history"]) >= 2 * total_samples:
        prev_losses = session["loss_history"][-(2 * total_samples):-total_samples]
        prev_avg_loss = float(np.mean(prev_losses))
    
    loss_change = avg_loss - prev_avg_loss
    
    # Weight/bias changes this epoch
    w_start_idx = -(total_samples + 1)
    b_start_idx = -(total_samples + 1)
    
    w_change = model.w - session["w_history"][w_start_idx]
    b_change = model.b - session["b_history"][b_start_idx]
    
    return {
        "epoch": int(epoch_num),
        "majority_class": int(majority_class),
        "majority_count": int(majority_count),
        "total_samples": int(total_samples),
        "class_0_count": int(class_0_count),
        "class_1_count": int(class_1_count),
        "avg_loss": float(avg_loss),
        "loss_change": float(loss_change),
        "w_current": float(model.w),
        "w_change": float(w_change),
        "b_current": float(model.b),
        "b_change": float(b_change),
        "hardest_point_idx": int(hardest_point_idx),
        "hardest_error": float(hardest_error),
        "hardest_point_x": float(x_data[hardest_point_idx]),
        "hardest_point_y": int(y_data[hardest_point_idx]),
    }



@router.post("/start")
def start_training(request: StartTrainingRequest):
    """Start a new logistic regression training session."""

    global _current_session

    x_data = np.array(request.dataset.get("x", []), dtype=float)
    y_data = np.array(request.dataset.get("y", []), dtype=int)

    if len(x_data) == 0 or len(y_data) == 0 or len(x_data) != len(y_data):
        raise HTTPException(status_code=400, detail="Invalid dataset for logistic training")

    _current_session = {
        "x_data": x_data,
        "y_data": y_data,
        "model": LogisticRegression(request.learning_rate),
        "epoch": 0,
        "loss_history": [],
        "w_history": [1.0],
        "b_history": [1.0],
    }

    return {
        "message": "Training started",
        "samples": len(x_data),
    }


@router.post("/step")
def training_step():
    """Perform one SGD step for logistic regression."""

    global _current_session
    if not _current_session:
        raise HTTPException(status_code=400, detail="No training session")

    session = _current_session
    step_idx = session["epoch"]
    total_samples = len(session["x_data"])

    x = float(session["x_data"][step_idx % total_samples])
    y = int(session["y_data"][step_idx % total_samples])

    step_info = session["model"].gradient_step(x, y)

    session["loss_history"].append(float(step_info["loss"]))
    session["w_history"].append(float(session["model"].w))
    session["b_history"].append(float(session["model"].b))

    # Full-dataset loss for trend plotting
    bce_after = session["model"].bce_loss(session["x_data"], session["y_data"])

    is_last = ((step_idx + 1) % total_samples == 0)
    completed_epoch = (step_idx + 1) // total_samples

    session["epoch"] += 1

    contributions = {
        "errors": [float(step_info["error"])],
        "dw_individual": [float(step_info["grad_w"])],
        "db_individual": [float(step_info["grad_b"])],
    }

    # Calculate epoch summary if this is last point
    epoch_summary = None
    if is_last:
        epoch_summary = calculate_epoch_summary(session, completed_epoch)

    return {
        "point_index": step_idx % total_samples,
        "total_points": total_samples,
        "x_value": x,
        "y_actual": y,
        "y_predicted": float(step_info["prediction"]),
        "error": float(step_info["error"]),
        "loss": float(step_info["loss"]),
        "loss_after": float(bce_after),
        "loss_history": [float(v) for v in session["loss_history"]],
        "contribution_w": float(step_info["grad_w"]),
        "contribution_b": float(step_info["grad_b"]),
        "contributions": contributions,
        "w_current": float(session["model"].w),
        "b_current": float(session["model"].b),
        "is_last_point": bool(is_last),
        "epoch": completed_epoch if is_last else session["epoch"] // total_samples,
        "epoch_summary": epoch_summary,
        "explanation": (
            f"Sample {step_idx % total_samples + 1}/{total_samples}: "
            f"y_true={y}, p(y=1)={step_info['prediction']:.4f}, "
            f"sample_bce={step_info['loss']:.6f}"
        ),
        "explanations": [
            f"Prediction probability uses sigmoid(w*x+b).",
            f"Current sample error: p - y = {step_info['error']:.6f}.",
            f"Updated params: w={session['model'].w:.6f}, b={session['model'].b:.6f}.",
            "Loss shown is Binary Cross-Entropy.",
        ],
    }


@router.get("/state")
def get_training_state():
    """Get current logistic training state."""

    global _current_session
    if not _current_session:
        raise HTTPException(status_code=400, detail="No training session")

    session = _current_session
    model = session["model"]

    return {
        "w": float(model.w),
        "b": float(model.b),
        "epoch": session["epoch"] // len(session["x_data"]),
        "loss_history": [float(v) for v in session["loss_history"]],
        "w_history": [float(v) for v in session["w_history"]],
        "b_history": [float(v) for v in session["b_history"]],
    }
