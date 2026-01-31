"""
API Routes pentru training și gradient descent
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import GradientStepResponse, FreezeStateResponse, LearningRateConfig, LearningRateResponse
from app.services.ml_service import MLService
from app.services.explanation_service import ExplanationService
import numpy as np

router = APIRouter(prefix="/api", tags=["training"])

# State global (în producție ar fi Redis/DB)
state = {
    "data": {"x": None, "y": None},
    "model": {"w": 1.0, "b": 1.0},
    "history": {"loss": [], "w": [], "b": []},
    "config": {"lr": 0.01, "current_epoch": 0}
}

ml_service = MLService()
explanation_service = ExplanationService()


@router.post("/gradient/step", response_model=GradientStepResponse)
async def gradient_step():
    """
    Execută UN SINGUR gradient descent step.
    Returnează toate informațiile necesare pentru explicație.
    """
    if state["data"]["x"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded")
    
    x = state["data"]["x"]
    y = state["data"]["y"]
    w = state["model"]["w"]
    b = state["model"]["b"]
    lr = state["config"]["lr"]
    
    # Calculează predicții ÎNAINTE
    y_pred_before = ml_service.calculate_predictions(x, w, b)
    
    # Erori per punct
    errors, error_magnitudes = ml_service.calculate_errors_per_point(y, y_pred_before)
    
    # Contribuții individuale
    contributions = ml_service.calculate_point_contributions(x, y, y_pred_before)
    
    # Gradienți
    dw, db, grad_magnitude = ml_service.calculate_gradients(x, y, y_pred_before)
    
    # Actualizează parametri
    w_new, b_new, delta_w, delta_b = ml_service.update_parameters(w, b, dw, db, lr)
    
    # Predicții DUPĂ
    y_pred_after = ml_service.calculate_predictions(x, w_new, b_new)
    
    # Loss
    loss_before = ml_service.calculate_mse(y, y_pred_before)
    loss_after = ml_service.calculate_mse(y, y_pred_after)
    loss_delta = loss_after - loss_before
    
    # Explicații
    explanations = explanation_service.generate_step_explanation(
        x, y, y_pred_before, w, b, dw, db, lr, errors
    )
    
    # Actualizează state
    state["model"]["w"] = w_new
    state["model"]["b"] = b_new
    state["history"]["loss"].append(float(loss_after))
    state["history"]["w"].append(float(w_new))
    state["history"]["b"].append(float(b_new))
    state["config"]["current_epoch"] += 1
    
    # Clasifică erori
    error_categories = ml_service.categorize_errors(error_magnitudes)
    
    return GradientStepResponse(
        epoch=state["config"]["current_epoch"],
        w_before=float(w),
        b_before=float(b),
        w_after=float(w_new),
        b_after=float(b_new),
        delta_w=float(delta_w),
        delta_b=float(delta_b),
        gradient_w=float(dw),
        gradient_b=float(db),
        gradient_magnitude=float(grad_magnitude),
        loss_before=float(loss_before),
        loss_after=float(loss_after),
        loss_delta=float(loss_delta),
        loss_history=state["history"]["loss"],
        errors=errors.tolist(),
        error_magnitudes=error_magnitudes.tolist(),
        error_categories=error_categories,
        contributions=contributions,
        predictions_before=y_pred_before.tolist(),
        predictions_after=y_pred_after.tolist(),
        explanations=explanations,
        learning_rate=lr,
        step_size=float(lr * grad_magnitude)
    )


@router.get("/state/current", response_model=FreezeStateResponse)
async def get_current_state():
    """Returnează starea curentă pentru modul 'Freeze & Explain'."""
    if state["data"]["x"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded")
    
    x = state["data"]["x"]
    y = state["data"]["y"]
    w = state["model"]["w"]
    b = state["model"]["b"]
    
    y_pred = ml_service.calculate_predictions(x, w, b)
    errors, _ = ml_service.calculate_errors_per_point(y, y_pred)
    contributions = ml_service.calculate_point_contributions(x, y, y_pred)
    dw, db, grad_magnitude = ml_service.calculate_gradients(x, y, y_pred)
    loss = ml_service.calculate_mse(y, y_pred)
    
    mse_formula = {
        "formula": "MSE = (1/n) Σ(yᵢ - ŷᵢ)²",
        "n": len(x),
        "sum_squared_errors": float(np.sum(errors**2)),
        "mse_value": float(loss),
        "individual_squared_errors": (errors**2).tolist()
    }
    
    gradient_formula = {
        "dw_formula": "∇w = -(2/n) Σ xᵢ(yᵢ - ŷᵢ)",
        "db_formula": "∇b = -(2/n) Σ (yᵢ - ŷᵢ)",
        "dw_value": float(dw),
        "db_value": float(db),
        "sum_x_errors": float(np.sum(x * errors)),
        "sum_errors": float(np.sum(errors))
    }
    
    return FreezeStateResponse(
        model={
            "w": float(w),
            "b": float(b),
            "equation": f"y = {w:.4f}·x + {b:.4f}"
        },
        loss=float(loss),
        gradient={
            "dw": float(dw),
            "db": float(db),
            "magnitude": float(grad_magnitude)
        },
        mse_breakdown=mse_formula,
        gradient_breakdown=gradient_formula,
        predictions=y_pred.tolist(),
        errors=errors.tolist(),
        contributions=contributions,
        epoch=state["config"]["current_epoch"]
    )


@router.post("/config/learning-rate", response_model=LearningRateResponse)
async def set_learning_rate(config: LearningRateConfig):
    """Setează learning rate și returnează warnings."""
    state["config"]["lr"] = config.learning_rate
    
    warnings = explanation_service.analyze_learning_rate(config.learning_rate)
    
    return LearningRateResponse(
        learning_rate=config.learning_rate,
        warnings=warnings,
        status="ok" if not warnings else "warning"
    )


@router.post("/model/reset")
async def reset_model():
    """Resetează doar modelul, păstrează datele."""
    state["model"]["w"] = 1.0
    state["model"]["b"] = 1.0
    state["history"]["loss"] = []
    state["history"]["w"] = []
    state["history"]["b"] = []
    state["config"]["current_epoch"] = 0
    
    return {
        "message": "Model reset to initial state",
        "w": state["model"]["w"],
        "b": state["model"]["b"],
        "learning_rate": state["config"]["lr"]
    }
