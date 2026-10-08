import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    cohen_kappa_score,
    mean_absolute_error,
    root_mean_squared_error,
    mean_absolute_percentage_error,
    r2_score
)
from app.schemas import ModelMetrics

def calculate_classification_metrics(
    y_true: List[str],
    y_pred: List[str],
    classes: List[str]
) -> ModelMetrics:
    """
    Calculates actual classification metrics from ground truth and model predictions.
    Strictly calculates every metric; never reports hardcoded or uncalculated values.
    """
    if len(y_true) == 0 or len(y_pred) == 0:
        raise ValueError("Cannot calculate metrics on empty prediction set.")

    # 1. Overall Accuracy
    acc = float(accuracy_score(y_true, y_pred))

    # 2. Weighted Precision
    prec = float(precision_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))

    # 3. Weighted Recall
    rec = float(recall_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))

    # 4. Weighted F1 Score
    f1 = float(f1_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))

    # 5. Cohen's Kappa Coefficient
    kappa = float(cohen_kappa_score(y_true, y_pred, labels=classes))

    # 6. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=classes).tolist()

    return ModelMetrics(
        accuracy=round(acc, 4),
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1=round(f1, 4),
        kappa=round(kappa, 4),
        confusion_matrix=cm,
        classes=classes
    )

def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict[str, float]:
    """
    Calculates actual regression/forecasting metrics when regression models are trained.
    """
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    mape = float(mean_absolute_percentage_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape": round(mape, 4),
        "r2": round(r2, 4)
    }
