from typing import Dict

import numpy as np
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/logistic")
def get_logistic_dataset(dataset_type: str = Query("simple")) -> Dict:
    """
    Generate binary classification datasets for logistic regression.

    Supported dataset types:
    - simple
    - overlapping
    - noisy
    """
    np.random.seed(42)
    n_samples = 40

    if dataset_type == "simple":
        x_class0 = np.random.uniform(0, 5, n_samples // 2)
        y_class0 = np.zeros(n_samples // 2, dtype=int)

        x_class1 = np.random.uniform(5, 10, n_samples // 2)
        y_class1 = np.ones(n_samples // 2, dtype=int)

        x = np.concatenate([x_class0, x_class1])
        y = np.concatenate([y_class0, y_class1])

    elif dataset_type == "overlapping":
        x = np.random.uniform(0, 10, n_samples)
        logits = -2 + 0.5 * x
        probs = 1 / (1 + np.exp(-logits))
        y = (np.random.uniform(0, 1, n_samples) < probs).astype(int)

    elif dataset_type == "noisy":
        x = np.random.uniform(0, 10, n_samples)
        logits = -1 + 0.3 * x + np.random.normal(0, 0.5, n_samples)
        probs = 1 / (1 + np.exp(-logits))
        y = (np.random.uniform(0, 1, n_samples) < probs).astype(int)

    else:
        x = np.random.uniform(0, 10, n_samples)
        logits = -2 + 0.5 * x
        probs = 1 / (1 + np.exp(-logits))
        y = (np.random.uniform(0, 1, n_samples) < probs).astype(int)
        dataset_type = "overlapping"

    shuffle_idx = np.random.permutation(n_samples)
    x = x[shuffle_idx]
    y = y[shuffle_idx]

    return {
        "x": x.tolist(),
        "y": y.tolist(),
        "type": dataset_type,
    }
