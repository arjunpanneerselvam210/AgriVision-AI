package com.agrivision.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SatelliteAnalysisDto {

    private UUID id;
    private UUID studyAreaId;
    private String studyAreaName;
    private String sensor;
    private String sceneId;
    private Instant acquisitionDate;
    private Double cloudCover;
    private String processingLevel;
    private String status;
    private String parametersJson;
    private String metadataJson;
    private String failureReason;
    private Instant completedAt;
    private Instant createdAt;
}
