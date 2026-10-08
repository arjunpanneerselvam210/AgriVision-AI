import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional, Union
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

from app.schemas import TrainingSample, VALID_CLASSES
from app.metrics import calculate_classification_metrics

DEFAULT_FEATURE_NAMES = [
    "B2", "B3", "B4", "B8", "B11",
    "NDVI", "NDWI", "LSWI",
    "VV", "VH", "VV_VH_ratio"
]

class PyTorchCropNet(nn.Module):
    """Deep Neural Network for Multi-Spectral & SAR Crop Classification."""
    def __init__(self, input_dim: int, num_classes: int = 3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, num_classes)
        )

    def forward(self, x):
        return self.net(x)


class MLPipeline:
    def __init__(self, storage_dir: str = "saved_models"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

    @staticmethod
    def extract_feature_vector(
        item: Union[Dict[str, float], List[float], Any],
        feature_names: List[str]
    ) -> List[float]:
        """Validates and extracts an aligned feature vector, deriving indices if needed."""
        if isinstance(item, list):
            # Flat float vector
            if len(item) < len(feature_names):
                padded = item + [0.0] * (len(feature_names) - len(item))
                return padded[:len(feature_names)]
            return item[:len(feature_names)]

        # Dictionary or Pydantic object
        data = item.dict() if hasattr(item, "dict") else dict(item)

        # Compute derived indices if missing but raw bands are present
        b2 = data.get("B2")
        b3 = data.get("B3")
        b4 = data.get("B4")
        b8 = data.get("B8")
        b11 = data.get("B11")
        vv = data.get("VV")
        vh = data.get("VH")

        if data.get("NDVI") is None and b8 is not None and b4 is not None:
            denom = b8 + b4
            data["NDVI"] = (b8 - b4) / denom if denom != 0 else 0.0

        if data.get("NDWI") is None and b3 is not None and b8 is not None:
            denom = b3 + b8
            data["NDWI"] = (b3 - b8) / denom if denom != 0 else 0.0

        if data.get("LSWI") is None and b8 is not None and b11 is not None:
            denom = b8 + b11
            data["LSWI"] = (b8 - b11) / denom if denom != 0 else 0.0

        if data.get("VV_VH_ratio") is None and vv is not None and vh is not None:
            data["VV_VH_ratio"] = vv - vh  # dB difference / ratio

        vector = []
        for name in feature_names:
            val = data.get(name)
            if val is None:
                # Check inside 'extra' subdict if present
                extra = data.get("extra", {})
                val = extra.get(name, 0.0)
            vector.append(float(val) if val is not None else 0.0)

        return vector

    def train_model(
        self,
        samples: List[TrainingSample],
        model_id: str,
        algorithm: str = "RANDOM_FOREST",
        split_method: str = "stratified",
        test_size: float = 0.2,
        hyperparameters: Optional[Dict[str, Any]] = None
    ) -> Tuple[Dict[str, Any], Any]:
        """
        Executes end-to-end training:
        1. Validates dataset
        2. Preprocesses data & aligns features
        3. Splits train/validation/test (chronologically or stratified)
        4. Trains model
        5. Evaluates REAL metrics on test partition
        6. Persists model artifacts to disk
        """
        if len(samples) < 10:
            raise ValueError(f"Insufficient training samples ({len(samples)}). Minimum 10 samples required for validation.")

        feature_names = DEFAULT_FEATURE_NAMES
        X_rows = []
        y_labels = []
        timestamps = []

        for s in samples:
            label = s.label.upper().strip()
            if label not in VALID_CLASSES:
                label = "OTHER"
            y_labels.append(label)
            X_rows.append(self.extract_feature_vector(s.features, feature_names))
            timestamps.append(s.timestamp if s.timestamp else datetime.utcnow().isoformat())

        X = np.array(X_rows, dtype=np.float32)
        y = np.array(y_labels)

        # Chronological vs Stratified Split
        if split_method == "chronological":
            # Sort by timestamp
            sort_indices = np.argsort(timestamps)
            X = X[sort_indices]
            y = y[sort_indices]
            split_idx = int(len(X) * (1.0 - test_size))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
        else:
            # Stratified Split (handles singletons safely)
            try:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42, stratify=y
                )
            except ValueError:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=42
                )

        # Fit Scaler
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        classes = VALID_CLASSES
        class_to_idx = {c: i for i, c in enumerate(classes)}

        algo_upper = algorithm.upper()

        if "PYTORCH" in algo_upper or "NN" in algo_upper:
            # PyTorch Deep Neural Network Training
            model, y_pred = self._train_pytorch(
                X_train_scaled, y_train, X_test_scaled, y_test, class_to_idx, classes, hyperparameters
            )
            model_type = "PYTORCH"
        elif "GRADIENT" in algo_upper or "GB" in algo_upper:
            # Histogram Gradient Boosting
            clf = HistGradientBoostingClassifier(random_state=42)
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test).tolist()
            model = clf
            model_type = "SKLEARN"
        else:
            # Random Forest
            n_trees = (hyperparameters or {}).get("n_estimators", 100)
            clf = RandomForestClassifier(n_estimators=n_trees, max_depth=12, random_state=42)
            clf.fit(X_train, y_train)
            y_pred = clf.predict(X_test).tolist()
            model = clf
            model_type = "SKLEARN"

        # Calculate actual metrics on held-out test set
        metrics = calculate_classification_metrics(y_true=y_test.tolist(), y_pred=y_pred, classes=classes)

        # Save artifacts
        model_file = os.path.join(self.storage_dir, f"{model_id}.joblib")
        artifact = {
            "model_type": model_type,
            "model": model,
            "scaler": scaler,
            "classes": classes,
            "feature_names": feature_names,
            "algorithm": algorithm
        }
        joblib.dump(artifact, model_file)

        return metrics, artifact

    def _train_pytorch(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        class_to_idx: Dict[str, int],
        classes: List[str],
        hyperparameters: Optional[Dict[str, Any]]
    ) -> Tuple[PyTorchCropNet, List[str]]:
        epochs = (hyperparameters or {}).get("epochs", 40)
        lr = (hyperparameters or {}).get("learning_rate", 0.005)

        y_train_idx = np.array([class_to_idx.get(lbl, 2) for lbl in y_train])
        y_test_idx = np.array([class_to_idx.get(lbl, 2) for lbl in y_test])

        train_dataset = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train_idx, dtype=torch.long))
        train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

        model = PyTorchCropNet(input_dim=X_train.shape[1], num_classes=len(classes))
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=lr)

        model.train()
        for epoch in range(epochs):
            for batch_x, batch_y in train_loader:
                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()

        model.eval()
        with torch.no_grad():
            test_x_tensor = torch.tensor(X_test, dtype=torch.float32)
            logits = model(test_x_tensor)
            preds_idx = torch.argmax(logits, dim=1).numpy()
            y_pred = [classes[i] for i in preds_idx]

        return model, y_pred

    def load_model(self, model_id: str) -> Dict[str, Any]:
        model_file = os.path.join(self.storage_dir, f"{model_id}.joblib")
        if not os.path.exists(model_file):
            raise FileNotFoundError(f"Model artifact {model_id} not found on disk.")
        return joblib.load(model_file)
