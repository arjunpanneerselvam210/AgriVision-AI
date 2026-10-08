package com.agrivision.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * HTTP Client connecting the Spring Boot Backend to the independent Python FastAPI ML Service.
 *
 * Flow:
 * Spring Boot -> ML API (http://localhost:8000) -> Python model -> Prediction -> Spring Boot -> PostgreSQL/PostGIS
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MlServiceClient {

    private final ObjectMapper objectMapper;

    @Value("${ml-service.base-url:http://localhost:8000}")
    private String mlServiceBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PredictionItemDto {
        @JsonProperty("predicted_class")
        private String predictedClass;
        private Double confidence;
        private Map<String, Double> probabilities;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PredictionResponseDto {
        @JsonProperty("model_id")
        private String modelId;
        @JsonProperty("model_version")
        private String modelVersion;
        private Integer count;
        private List<PredictionItemDto> predictions;
    }

    /**
     * Calls POST /predict on the Python ML service to classify field crop type.
     */
    public PredictionResponseDto predict(List<Map<String, Object>> features, String modelId) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            if (modelId != null) {
                payload.put("model_id", modelId);
            }
            payload.put("features", features);
            payload.put("include_probabilities", true);

            String requestJson = objectMapper.writeValueAsString(payload);
            String url = mlServiceBaseUrl + "/predict";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return objectMapper.readValue(response.body(), PredictionResponseDto.class);
            } else {
                log.error("ML service returned HTTP {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("ML service error: " + response.body());
            }
        } catch (Exception e) {
            log.error("Failed to communicate with Python ML Service: {}", e.getMessage());
            throw new RuntimeException("Failed to call ML Service: " + e.getMessage(), e);
        }
    }

    /**
     * Checks health of the Python ML microservice.
     */
    public boolean isHealthy() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceBaseUrl + "/health"))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}
