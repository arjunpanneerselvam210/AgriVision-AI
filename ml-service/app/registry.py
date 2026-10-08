import os
import json
import uuid
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np

from app.schemas import ModelInfo, ModelMetrics, TrainingSample
from app.pipeline import MLPipeline, DEFAULT_FEATURE_NAMES

REGISTRY_FILE = os.path.join("saved_models", "registry.json")

class ModelRegistry:
    def __init__(self, pipeline: MLPipeline):
        self.pipeline = pipeline
        self.registry: Dict[str, Dict] = {}
        self.active_model_id: Optional[str] = None
        self._load_registry()

        # If no models exist, initialize and train a baseline model to make predictions immediately operational
        if not self.registry:
            self._bootstrap_baseline_model()

    def _load_registry(self):
        if os.path.exists(REGISTRY_FILE):
            try:
                with open(REGISTRY_FILE, "r") as f:
                    data = json.load(f)
                    self.registry = data.get("models", {})
                    self.active_model_id = data.get("active_model_id")
            except Exception as e:
                print(f"Error loading registry: {e}")
                self.registry = {}

    def _save_registry(self):
        os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
        with open(REGISTRY_FILE, "w") as f:
            json.dump({
                "active_model_id": self.active_model_id,
                "models": self.registry
            }, f, indent=2)

    def register_model(
        self,
        name: str,
        version: str,
        algorithm: str,
        metrics: ModelMetrics,
        model_id: Optional[str] = None,
        is_active: bool = True
    ) -> ModelInfo:
        mid = model_id or str(uuid.uuid4())
        info = ModelInfo(
            model_id=mid,
            name=name,
            version=version,
            algorithm=algorithm,
            classes=metrics.classes,
            feature_names=DEFAULT_FEATURE_NAMES,
            metrics=metrics,
            created_at=datetime.utcnow().isoformat(),
            is_active=is_active,
            description="AgriVision multi-source optical (Sentinel-2) & SAR (Sentinel-1) crop classifier"
        )

        self.registry[mid] = info.dict()
        if is_active or self.active_model_id is None:
            self.active_model_id = mid
        self._save_registry()
        return info

    def get_model(self, model_id: str) -> Optional[ModelInfo]:
        data = self.registry.get(model_id)
        return ModelInfo(**data) if data else None

    def get_all_models(self) -> List[ModelInfo]:
        return [ModelInfo(**v) for v in self.registry.values()]

    def _bootstrap_baseline_model(self):
        """
        Creates and trains an initial baseline Random Forest model with realistic agricultural signatures:
        - PADDY: High LSWI (water/flooding during transplantation), high NIR, VV drop during transplant followed by rise.
        - BANANA: High NDVI year-round, persistent high biomass, high VH and VV backscatter.
        - OTHER: Lower NDVI/LSWI, varied soil/urban/scrub backscatter.
        Calculates REAL metrics on test partition and saves artifacts.
        """
        np.random.seed(42)
        samples: List[TrainingSample] = []

        # 60 Paddy samples
        for i in range(60):
            samples.append(TrainingSample(
                features={
                    "B2": float(np.random.normal(0.04, 0.01)),
                    "B3": float(np.random.normal(0.06, 0.01)),
                    "B4": float(np.random.normal(0.05, 0.01)),
                    "B8": float(np.random.normal(0.42, 0.04)),
                    "B11": float(np.random.normal(0.18, 0.03)),
                    "NDVI": float(np.random.normal(0.78, 0.05)),
                    "NDWI": float(np.random.normal(-0.35, 0.05)),
                    "LSWI": float(np.random.normal(0.40, 0.06)),
                    "VV": float(np.random.normal(-11.5, 1.2)),
                    "VH": float(np.random.normal(-18.0, 1.5)),
                    "VV_VH_ratio": float(np.random.normal(6.5, 0.8))
                },
                label="PADDY",
                timestamp=f"2026-01-{(i%28)+1:02d}T10:00:00Z"
            ))

        # 60 Banana samples
        for i in range(60):
            samples.append(TrainingSample(
                features={
                    "B2": float(np.random.normal(0.03, 0.01)),
                    "B3": float(np.random.normal(0.08, 0.01)),
                    "B4": float(np.random.normal(0.04, 0.01)),
                    "B8": float(np.random.normal(0.55, 0.04)),
                    "B11": float(np.random.normal(0.14, 0.02)),
                    "NDVI": float(np.random.normal(0.85, 0.04)),
                    "NDWI": float(np.random.normal(-0.45, 0.04)),
                    "LSWI": float(np.random.normal(0.55, 0.05)),
                    "VV": float(np.random.normal(-8.5, 1.0)),
                    "VH": float(np.random.normal(-14.2, 1.1)),
                    "VV_VH_ratio": float(np.random.normal(5.7, 0.6))
                },
                label="BANANA",
                timestamp=f"2026-02-{(i%28)+1:02d}T10:00:00Z"
            ))

        # 60 Other samples (barren / scrub / non-crop)
        for i in range(60):
            samples.append(TrainingSample(
                features={
                    "B2": float(np.random.normal(0.09, 0.02)),
                    "B3": float(np.random.normal(0.11, 0.02)),
                    "B4": float(np.random.normal(0.14, 0.03)),
                    "B8": float(np.random.normal(0.20, 0.03)),
                    "B11": float(np.random.normal(0.28, 0.04)),
                    "NDVI": float(np.random.normal(0.25, 0.08)),
                    "NDWI": float(np.random.normal(-0.10, 0.05)),
                    "LSWI": float(np.random.normal(-0.15, 0.05)),
                    "VV": float(np.random.normal(-15.0, 2.0)),
                    "VH": float(np.random.normal(-22.0, 2.2)),
                    "VV_VH_ratio": float(np.random.normal(7.0, 1.0))
                },
                label="OTHER",
                timestamp=f"2026-03-{(i%28)+1:02d}T10:00:00Z"
            ))

        mid = "model-rf-baseline-v1"
        metrics, _ = self.pipeline.train_model(
            samples=samples,
            model_id=mid,
            algorithm="RANDOM_FOREST",
            split_method="stratified",
            test_size=0.2
        )

        self.register_model(
            name="AgriVision-RF-Baseline",
            version="v1.0.0",
            algorithm="RANDOM_FOREST",
            metrics=metrics,
            model_id=mid,
            is_active=True
        )
