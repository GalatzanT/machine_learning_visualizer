"""
Service pentru generare explicații automate
Analizează starea algoritmului și generează text explicativ
"""
import numpy as np
from typing import List


class ExplanationService:
    """Service pentru generare explicații despre procesul de învățare"""
    
    @staticmethod
    def generate_step_explanation(
        x: np.ndarray,
        y: np.ndarray,
        y_pred: np.ndarray,
        w: float,
        b: float,
        dw: float,
        db: float,
        lr: float,
        errors: np.ndarray
    ) -> List[str]:
        """
        Generează explicații textuale despre ce se întâmplă în acest pas.
        """
        explanations = []
        n = len(x)
        
        # 1. Analiză poziționare linie vs puncte
        positive_errors = np.sum(errors > 0)
        negative_errors = np.sum(errors < 0)
        
        if positive_errors > negative_errors * 1.5:
            explanations.append(f"🔴 Linia este SUB majoritatea punctelor ({positive_errors}/{n})")
            explanations.append("➡️ Bias-ul (b) va CREȘTE pentru a ridica linia")
        elif negative_errors > positive_errors * 1.5:
            explanations.append(f"🔵 Linia este PESTE majoritatea punctelor ({negative_errors}/{n})")
            explanations.append("➡️ Bias-ul (b) va SCĂDEA pentru a coborî linia")
        else:
            explanations.append("🟢 Linia este relativ echilibrată față de puncte")
        
        # 2. Analiză gradient w (pantă)
        if abs(dw) > 0.1:
            direction = "SCADĂ" if dw > 0 else "CREASCĂ"
            explanations.append(f"📊 Panta trebuie să {direction} (gradient w = {dw:.3f})")
        else:
            explanations.append("✅ Panta este aproape optimă")
        
        # 3. Analiză gradient b
        if abs(db) > 0.1:
            direction = "SCĂDEA" if db > 0 else "CREȘTE"
            explanations.append(f"⬆️⬇️ Interceptul va {direction} (gradient b = {db:.3f})")
        
        # 4. Analiză learning rate
        step_size = lr * abs(dw) + lr * abs(db)
        if step_size > 1.0:
            explanations.append("⚠️ ATENȚIE: Learning rate prea mare → pași foarte mari!")
            explanations.append("Riscul de oscilație sau divergență este crescut")
        elif step_size < 0.001:
            explanations.append("🐌 Learning rate mic → progres foarte lent")
        
        # 5. Identifică punctele problematice
        error_magnitudes = np.abs(errors)
        max_error_idx = np.argmax(error_magnitudes)
        max_error = error_magnitudes[max_error_idx]
        
        if max_error > np.mean(error_magnitudes) * 2:
            explanations.append(f"⭐ Punctul {max_error_idx} are eroarea cea mai mare ({max_error:.2f})")
            explanations.append("Acest punct 'trage' puternic gradientul în direcția sa")
        
        # 6. Predicție convergență
        gradient_mag = np.sqrt(dw**2 + db**2)
        if gradient_mag < 0.01:
            explanations.append("✨ CONVERGENȚĂ APROAPE! Gradientul este foarte mic")
        elif gradient_mag > 1.0:
            explanations.append("🚀 Încă departe de optimum, gradient mare")
        
        return explanations
    
    @staticmethod
    def analyze_learning_rate(lr: float) -> List[str]:
        """Analizează dacă learning rate-ul este adecvat."""
        warnings = []
        
        if lr > 0.1:
            warnings.append("⚠️ Learning rate FOARTE MARE! Risc de oscilație sau divergență.")
        elif lr > 0.05:
            warnings.append("⚠️ Learning rate mare. Modelul poate oscila.")
        elif lr < 0.001:
            warnings.append("🐌 Learning rate foarte mic. Convergența va fi lentă.")
        
        return warnings
