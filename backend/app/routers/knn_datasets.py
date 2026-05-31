from typing import Dict
from fastapi import APIRouter, Query
import numpy as np

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/knn")
def get_knn_dataset(dataset_type: str = Query("simple")) -> Dict:
    """
    Generate binary classification dataset for KNN.
    dataset_type: "simple", "clusters", "complex"
    """
    np.random.seed(42)
    
    if dataset_type == "simple":
        # Two clear clusters
        x_class0 = np.random.normal(2, 0.8, 20)
        y_class0 = np.zeros(20, dtype=int)
        
        x_class1 = np.random.normal(7, 0.8, 20)
        y_class1 = np.ones(20, dtype=int)
    
    elif dataset_type == "clusters":
        # Multiple clusters per class
        x_class0 = np.concatenate([
            np.random.normal(1.5, 0.5, 10),
            np.random.normal(8, 0.5, 10)
        ])
        y_class0 = np.zeros(20, dtype=int)
        
        x_class1 = np.concatenate([
            np.random.normal(4, 0.6, 10),
            np.random.normal(6, 0.6, 10)
        ])
        y_class1 = np.ones(20, dtype=int)
    
    elif dataset_type == "complex":
        # Overlapping complex pattern
        x_class0 = np.random.uniform(0, 5, 20)
        y_class0 = np.zeros(20, dtype=int)
        
        x_class1 = np.random.uniform(3.5, 10, 20)
        y_class1 = np.ones(20, dtype=int)
    
    else:
        # Default to simple
        x_class0 = np.random.normal(2, 0.8, 20)
        y_class0 = np.zeros(20, dtype=int)
        
        x_class1 = np.random.normal(7, 0.8, 20)
        y_class1 = np.ones(20, dtype=int)
    
    x = np.concatenate([x_class0, x_class1])
    y = np.concatenate([y_class0, y_class1])
    
    shuffle_idx = np.random.permutation(len(x))
    x = x[shuffle_idx]
    y = y[shuffle_idx]
    
    return {
        "x": x.tolist(),
        "y": y.tolist(),
        "type": dataset_type
    }
