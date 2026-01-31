"""
Service pentru management datasets
"""
import numpy as np
import pandas as pd
import io
from typing import Tuple


class DatasetService:
    """Service pentru încărcare și generare datasets"""
    
    @staticmethod
    def load_from_csv(content) -> Tuple[np.ndarray, np.ndarray]:
        """Încarcă dataset din CSV."""
        # Acceptă fie bytes fie BytesIO
        if isinstance(content, bytes):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            # content e deja BytesIO
            df = pd.read_csv(content)
        
        if len(df.columns) < 2:
            raise ValueError("CSV must have at least 2 columns")
        
        x = df.iloc[:, 0].values.astype(float)
        y = df.iloc[:, 1].values.astype(float)
        
        if np.any(np.isnan(x)) or np.any(np.isnan(y)):
            raise ValueError("Data contains missing values")
        
        return x, y
    
    @staticmethod
    def generate_dataset(dataset_type: str) -> Tuple[np.ndarray, np.ndarray, str]:
        """
        Generează dataset predefinit.
        Returns: (x, y, description)
        """
        np.random.seed(42)
        
        if dataset_type == "simple":
            x = np.linspace(0, 10, 20)
            y = 2 * x + 1 + np.random.normal(0, 1, 20)
            description = "Date liniare simple cu zgomot mic"
            
        elif dataset_type == "noisy":
            x = np.linspace(0, 10, 20)
            y = 2 * x + 1 + np.random.normal(0, 3, 20)
            description = "Date liniare cu zgomot mare"
            
        elif dataset_type == "outliers":
            x = np.linspace(0, 10, 20)
            y = 2 * x + 1 + np.random.normal(0, 1, 20)
            y[5] += 10
            y[15] -= 10
            description = "Date cu outlieri vizibili"
            
        else:
            raise ValueError(f"Unknown dataset type: {dataset_type}")
        
        return x, y, description
