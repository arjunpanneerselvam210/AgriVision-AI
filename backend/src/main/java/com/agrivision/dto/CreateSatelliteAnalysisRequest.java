package com.agrivision.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSatelliteAnalysisRequest {

    private UUID studyAreaId;

    @NotBlank(message = "Sensor is required (SENTINEL_1 or SENTINEL_2)")
    private String sensor;

    private String sceneId;

    private Instant acquisitionDate;

    private Instant startDate;

    private Instant endDate;

    @Builder.Default
    private Double cloudCoverThreshold = 20.0;

    @Builder.Default
    private List<String> bands = List.of();

    @Builder.Default
    private List<String> indices = List.of("NDVI", "NDWI", "LSWI");

    @Builder.Default
    private String compositeMethod = "MEDIAN";

    @Builder.Default
    private Boolean maskClouds = true;

    @Builder.Default
    private Boolean calculateTemporalStatistics = true;

    @Builder.Default
    private Boolean calculateRadarRatios = true;
}
