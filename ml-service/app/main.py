import sys
import uuid
import numpy as np
import torch
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionItem,
    TrainRequest,
    TrainResponse,
    ModelInfo,
    HealthResponse,
    VALID_CLASSES
)
from app.pipeline import MLPipeline, DEFAULT_FEATURE_NAMES
from app.registry import ModelRegistry

app = FastAPI(
    title="AgriVision AI Machine Learning Service",
    description="Independent Python Microservice for Multi-Source Crop Classification & Agro-Intelligence",
    version="1.0.0"
)

# Enable CORS for Spring Boot backend and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = MLPipeline(storage_dir="saved_models")
registry = ModelRegistry(pipeline=pipeline)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Returns service health status, active model ID, and Python runtime information."""
    all_models = registry.get_all_models()
    return HealthResponse(
        status="healthy",
        service="AgriVision-ML-Service",
        python_version=sys.version.split()[0],
        active_model_id=registry.active_model_id,
        total_models=len(all_models)
    )

@app.get("/models", response_model=List[ModelInfo], tags=["Models"])
def list_models():
    """Lists all registered crop classification and forecasting models with their calculated metrics."""
    return registry.get_all_models()

@app.get("/models/{model_id}", response_model=ModelInfo, tags=["Models"])
def get_model(model_id: str):
    """Retrieves full metadata and evaluation metrics for a specific model version."""
    model_info = registry.get_model(model_id)
    if not model_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with ID '{model_id}' was not found in registry."
        )
    return model_info

@app.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict(request: PredictionRequest):
    """
    Performs inference for crop parcels using optical (Sentinel-2) and SAR (Sentinel-1) inputs.
    Returns predicted class (PADDY, BANANA, OTHER), confidence score, and probability distribution.
    """
    target_model_id = request.model_id or registry.active_model_id
    if not target_model_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active model available for inference. Please train or register a model first."
        )

    model_info = registry.get_model(target_model_id)
    if not model_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model ID '{target_model_id}' not found."
        )

    try:
        artifact = pipeline.load_model(target_model_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model artifact: {str(e)}"
        )

    model = artifact["model"]
    model_type = artifact.get("model_type", "SKLEARN")
    scaler = artifact.get("scaler")
    classes = artifact.get("classes", VALID_CLASSES)
    feature_names = artifact.get("feature_names", DEFAULT_FEATURE_NAMES)

    if not request.features:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feature list is empty. At least one feature set must be provided."
        )

    # Prepare feature matrix
    X_rows = [pipeline.extract_feature_vector(f, feature_names) for f in request.features]
    X = np.array(X_rows, dtype=np.float32)

    predictions: List[PredictionItem] = []

    if model_type == "PYTORCH":
        # PyTorch Neural Network Inference
        X_scaled = scaler.transform(X) if scaler else X
        with torch.no_grad():
            inputs = torch.tensor(X_scaled, dtype=torch.float32)
            logits = model(inputs)
            probs = torch.softmax(logits, dim=1).numpy()

        for prob_vec in probs:
            best_idx = int(np.argmax(prob_vec))
            pred_class = classes[best_idx]
            conf = float(prob_vec[best_idx])
            prob_dict = {classes[i]: round(float(prob_vec[i]), 4) for i in range(len(classes))}

            predictions.append(PredictionItem(
                predicted_class=pred_class,
                confidence=round(conf, 4),
                probabilities=prob_dict if request.include_probabilities else {}
            ))
    else:
        # Scikit-learn (RandomForest, HistGradientBoosting)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)
            for prob_vec in probs:
                best_idx = int(np.argmax(prob_vec))
                pred_class = model.classes_[best_idx]
                conf = float(prob_vec[best_idx])
                prob_dict = {str(model.classes_[i]): round(float(prob_vec[i]), 4) for i in range(len(model.classes_))}

                predictions.append(PredictionItem(
                    predicted_class=pred_class,
                    confidence=round(conf, 4),
                    probabilities=prob_dict if request.include_probabilities else {}
                ))
        else:
            preds = model.predict(X)
            for p in preds:
                predictions.append(PredictionItem(
                    predicted_class=str(p),
                    confidence=1.0,
                    probabilities={str(p): 1.0}
                ))

    return PredictionResponse(
        model_id=target_model_id,
        model_version=model_info.version,
        count=len(predictions),
        predictions=predictions
    )

@app.post("/train", response_model=TrainResponse, status_code=status.HTTP_201_CREATED, tags=["Training"])
def train(request: TrainRequest):
    """
    Trains a new crop classification model on submitted field observations.
    - Validates dataset
    - Preprocesses and aligns features
    - Splits train/test (chronologically or stratified)
    - Trains model
    - Calculates real evaluation metrics (Accuracy, Precision, Recall, F1, Kappa, Confusion Matrix)
    - Saves model and registers model version
    """
    if not request.dataset or len(request.dataset) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset must contain at least 10 samples (received: {len(request.dataset) if request.dataset else 0})."
        )

    model_id = f"model-{uuid.uuid4().hex[:8]}"
    existing_count = len(registry.get_all_models())
    version = request.version or f"v1.{existing_count}.0"

    try:
        metrics, _ = pipeline.train_model(
            samples=request.dataset,
            model_id=model_id,
            algorithm=request.algorithm,
            split_method=request.split_method,
            test_size=request.test_size,
            hyperparameters=request.hyperparameters
        )

        model_info = registry.register_model(
            name=request.model_name,
            version=version,
            algorithm=request.algorithm,
            metrics=metrics,
            model_id=model_id,
            is_active=True
        )

        return TrainResponse(
            message=f"Model successfully trained and registered as version {version}.",
            model_info=model_info
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training pipeline execution failed: {str(e)}"
        )
