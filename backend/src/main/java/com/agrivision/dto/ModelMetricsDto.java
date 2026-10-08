package com.agrivision.dto;

import lombok.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelMetricsDto {

    private UUID modelId;
    private String modelName;
    private String algorithm;
    private Double overallAccuracy;
    private Double kappa;
    private Double weightedF1;
    private List<List<Integer>> confusionMatrix;
    private Map<String, Double> featureImportance;
    private ModelAblationDto ablation;
}
