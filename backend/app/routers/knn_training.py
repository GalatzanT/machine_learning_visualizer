from typing import Dict, List, Optional
import numpy as np
from fastapi import APIRouter, Body
from app.utils.jwt_utils import get_current_user

router = APIRouter(prefix="/api/knn-training", tags=["knn-training"])


class KNearestNeighbors:
    def __init__(self, k: int = 3):
        self.k = k
        self.X_train = None
        self.y_train = None
    
    def fit(self, X, y):
        """Store training data (lazy learning)"""
        self.X_train = np.array(X)
        self.y_train = np.array(y)
    
    def euclidean_distance(self, x1, x2):
        """Calculate distance between two points"""
        return float(np.sqrt((x1 - x2) ** 2))
    
    def predict_single(self, x):
        """Predict class for single sample"""
        if self.X_train is None:
            return None
        
        # Calculate distances to all training points
        distances = np.array([
            self.euclidean_distance(x, xi) 
            for xi in self.X_train
        ])
        
        # Find k nearest neighbors
        k_indices = np.argsort(distances)[:self.k]
        k_neighbors = self.y_train[k_indices]
        
        # Majority vote
        unique, counts = np.unique(k_neighbors, return_counts=True)
        predicted_class = unique[np.argmax(counts)]
        
        return {
            "prediction": int(predicted_class),
            "k_indices": k_indices.tolist(),
            "k_distances": distances[k_indices].tolist(),
            "k_neighbors": k_neighbors.tolist(),
            "votes": {str(int(u)): int(c) for u, c in zip(unique, counts)}
        }
    
    def get_decision_boundary(self, x_range, resolution=100):
        """Get decision boundary for visualization"""
        x_points = np.linspace(x_range[0], x_range[1], resolution)
        predictions = []
        
        for x in x_points:
            pred = self.predict_single(x)
            predictions.append(pred["prediction"] if pred else None)
        
        return {
            "x": x_points.tolist(),
            "y": predictions
        }


_current_knn_session: Optional[Dict] = None


@router.post("/start")
def start_knn_training(
    x: List[float] = Body(...),
    y: List[int] = Body(...),
    k: int = Body(3)
):
    """Initialize KNN with training data"""
    global _current_knn_session
    
    model = KNearestNeighbors(k=k)
    model.fit(x, y)
    
    _current_knn_session = {
        "model": model,
        "x_data": np.array(x),
        "y_data": np.array(y),
        "k": k,
        "predictions": [],
        "message": f"KNN initialized with k={k}, {len(x)} training samples"
    }
    
    return {
        "message": _current_knn_session["message"],
        "k": k,
        "samples": len(x)
    }


@router.post("/predict-point")
def predict_point(
    x: float = Body(...)
):
    """Predict single point"""
    global _current_knn_session
    
    if not _current_knn_session:
        return {"error": "No KNN session"}
    
    model = _current_knn_session["model"]
    
    # Get prediction
    result = model.predict_single(x)
    
    if not result:
        return {"error": "Could not predict"}
    
    # Store prediction
    _current_knn_session["predictions"].append({
        "x": x,
        "prediction": result["prediction"],
        "neighbors": result["k_neighbors"],
        "distances": result["k_distances"]
    })
    
    return {
        "x": float(x),
        "prediction": result["prediction"],
        "k": _current_knn_session["k"],
        "neighbors": result["k_neighbors"],
        "neighbor_indices": result["k_indices"],
        "neighbor_distances": result["k_distances"],
        "votes": result["votes"],
        "explanation": f"Found {_current_knn_session['k']} nearest neighbors. "
                      f"Classes: {result['votes']}. "
                      f"Predicted: {result['prediction']}"
    }


@router.get("/decision-boundary")
def get_decision_boundary():
    """Get decision boundary for visualization"""
    global _current_knn_session
    
    if not _current_knn_session:
        return {"error": "No KNN session"}
    
    x_range = [
        float(np.min(_current_knn_session["x_data"])) - 1,
        float(np.max(_current_knn_session["x_data"])) + 1
    ]
    
    boundary = _current_knn_session["model"].get_decision_boundary(x_range)
    
    return {
        "x": boundary["x"],
        "y": boundary["y"]
    }


@router.get("/state")
def get_knn_state():
    """Get current KNN state"""
    global _current_knn_session
    
    if not _current_knn_session:
        return {"error": "No KNN session"}
    
    return {
        "k": _current_knn_session["k"],
        "samples": len(_current_knn_session["x_data"]),
        "predictions_made": len(_current_knn_session["predictions"]),
        "message": _current_knn_session["message"]
    }
