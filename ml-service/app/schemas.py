from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

# Supported crop classification classes
VALID_CLASSES = ["PADDY", "BANANA", "OTHER"]

class FeatureInput(BaseModel):
    # Optical bands & indices
    B2: Optional[float] = Field(None, description="Sentinel-2 Blue band")
    B3: Optional[float] = Field(None, description="Sentinel-2 Green band")
    B4: Optional[float] = Field(None, description="Sentinel-2 Red band")
    B8: Optional[float] = Field(None, description="Sentinel-2 NIR band")
    B11: Optional[float] = Field(None, description="Sentinel-2 SWIR1 band")
    NDVI: Optional[float] = Field(None, description="Normalized Difference Vegetation Index")
    NDWI: Optional[float] = Field(None, description="Normalized Difference Water Index")
    LSWI: Optional[float] = Field(None, description="Land Surface Water Index")
    # SAR bands & ratios
    VV: Optional[float] = Field(None, description="Sentinel-1 VV polarization backscatter (dB)")
    VH: Optional[float] = Field(None, description="Sentinel-1 VH polarization backscatter (dB)")
    VV_VH_ratio: Optional[float] = Field(None, description="VV/VH or VH/VV polarimetric ratio")
    # Flexible additional features
    extra: Optional[Dict[str, float]] = Field(default_factory=dict)

class PredictionItem(BaseModel):
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]

class PredictionRequest(BaseModel):
    model_id: Optional[str] = None
    # Accepts list of feature dicts or list of float vectors
    features: List[Union[FeatureInput, Dict[str, float], List[float]]]
    include_probabilities: bool = True

class PredictionResponse(BaseModel):
    model_id: str
    model_version: str
    count: int
    predictions: List[PredictionItem]

class TrainingSample(BaseModel):
    features: Union[Dict[str, float], List[float]]
    label: str
    timestamp: Optional[str] = None  # ISO format string for chronological splitting

class ModelMetrics(BaseModel):
    # Classification metrics
    accuracy: float
    precision: float
    recall: float
    f1: float
    kappa: float
    confusion_matrix: List[List[int]]
    classes: List[str]
    # Optional regression/forecasting metrics
    mae: Optional[float] = None
    rmse: Optional[float] = None
    mape: Optional[float] = None
    r2: Optional[float] = None

class TrainRequest(BaseModel):
    model_name: str = "AgriVision-Crop-Classifier"
    algorithm: str = Field("RANDOM_FOREST", description="RANDOM_FOREST, GRADIENT_BOOSTING, or PYTORCH_NN")
    version: Optional[str] = None
    dataset: List[TrainingSample]
    split_method: str = Field("stratified", description="'stratified' or 'chronological'")
    val_size: float = 0.2
    test_size: float = 0.1
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelInfo(BaseModel):
    model_id: str
    name: str
    version: str
    algorithm: str
    classes: List[str]
    feature_names: List[str]
    metrics: ModelMetrics
    created_at: str
    is_active: bool
    description: Optional[str] = None

class TrainResponse(BaseModel):
    message: str
    model_info: ModelInfo

class HealthResponse(BaseModel):
    status: str
    service: str
    python_version: str
    active_model_id: Optional[str]
    total_models: int
