"""
Service pentru operații de Machine Learning
Conține toată logica de calcul pentru gradient descent și predicții
"""
import numpy as np
from typing import Tuple, Dict, List


class MLService:
    """Service pentru calcule Machine Learning"""
    
    @staticmethod
    def calculate_predictions(x: np.ndarray, w: float, b: float) -> np.ndarray:
        """Calculează predicțiile pentru fiecare punct."""
        return w * x + b
    
    @staticmethod
    def calculate_errors_per_point(y_true: np.ndarray, y_pred: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculează eroarea pentru fiecare punct individual.
        Returns: (erori, magnitudini_absolute)
        """
        errors = y_true - y_pred
        magnitudes = np.abs(errors)
        return errors, magnitudes
    
    @staticmethod
    def calculate_point_contributions(x: np.ndarray, y: np.ndarray, y_pred: np.ndarray) -> Dict:
        """
        Calculează contribuția fiecărui punct la gradient.
        """
        errors = y - y_pred
        
        dw_contributions = -2 * x * errors
        db_contributions = -2 * errors
        
        return {
            "dw_individual": dw_contributions.tolist(),
            "db_individual": db_contributions.tolist(),
            "errors": errors.tolist()
        }
    
    @staticmethod
    def calculate_gradients(x: np.ndarray, y: np.ndarray, y_pred: np.ndarray) -> Tuple[float, float, float]:
        """
        Calculează gradienții pentru w și b.
        Returns: (dw, db, gradient_magnitude)
        """
        n = len(x)
        errors = y - y_pred
        
        dw = -(2/n) * np.sum(x * errors)
        db = -(2/n) * np.sum(errors)
        
        gradient_magnitude = np.sqrt(dw**2 + db**2)
        
        return dw, db, gradient_magnitude
    
    @staticmethod
    def update_parameters(w: float, b: float, dw: float, db: float, lr: float) -> Tuple[float, float, float, float]:
        """
        Actualizează parametrii folosind learning rate.
        Returns: (w_new, b_new, delta_w, delta_b)
        """
        w_new = w - lr * dw
        b_new = b - lr * db
        
        delta_w = w_new - w
        delta_b = b_new - b
        
        return w_new, b_new, delta_w, delta_b
    
    @staticmethod
    def calculate_mse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """Calculează Mean Squared Error."""
        return float(np.mean((y_true - y_pred) ** 2))
    
    @staticmethod
    def categorize_errors(error_magnitudes: np.ndarray) -> List[str]:
        """
        Clasifică punctele după magnitudinea erorii.
        Returns: listă cu categorii ('low', 'medium', 'high')
        """
        max_error = np.max(error_magnitudes)
        categories = []
        
        for mag in error_magnitudes:
            if mag < max_error * 0.2:
                categories.append("low")
            elif mag < max_error * 0.5:
                categories.append("medium")
            else:
                categories.append("high")
        
        return categories
