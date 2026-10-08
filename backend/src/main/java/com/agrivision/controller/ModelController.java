package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.MlModelDto;
import com.agrivision.dto.ModelMetricsDto;
import com.agrivision.service.ModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/models")
@RequiredArgsConstructor
@Tag(name = "7. Model Management", description = "Endpoints for viewing Random Forest models, validation metrics, confusion matrices, and ablation testing")
public class ModelController {

    private final ModelService modelService;
    private final com.agrivision.service.MlServiceClient mlServiceClient;

    @GetMapping
    @Operation(summary = "List machine learning models", description = "Retrieves all registered ML models")
    public ResponseEntity<ApiResponse<List<MlModelDto>>> getModels() {
        List<MlModelDto> models = modelService.getModels();
        return ResponseEntity.ok(ApiResponse.success(models));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ML model by ID", description = "Retrieves metadata for a specific machine learning model")
    public ResponseEntity<ApiResponse<MlModelDto>> getModelById(@PathVariable UUID id) {
        MlModelDto model = modelService.getModelById(id);
        return ResponseEntity.ok(ApiResponse.success(model));
    }

    @GetMapping("/{id}/metrics")
    @Operation(summary = "Get ML model metrics", description = "Retrieves validation metrics, confusion matrix, feature importance, and ablation study results")
    public ResponseEntity<ApiResponse<ModelMetricsDto>> getModelMetrics(@PathVariable UUID id) {
        ModelMetricsDto metrics = modelService.getModelMetrics(id);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @PostMapping("/predict")
    @Operation(summary = "Predict crop classification via Python ML microservice", description = "Calls independent Python FastAPI ML service to run inference using Sentinel-1 SAR and Sentinel-2 optical features")
    public ResponseEntity<ApiResponse<com.agrivision.service.MlServiceClient.PredictionResponseDto>> predictCrop(
            @RequestBody java.util.Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        java.util.List<java.util.Map<String, Object>> features = (java.util.List<java.util.Map<String, Object>>) body.get("features");
        String modelId = (String) body.get("model_id");
        com.agrivision.service.MlServiceClient.PredictionResponseDto result = mlServiceClient.predict(features, modelId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
