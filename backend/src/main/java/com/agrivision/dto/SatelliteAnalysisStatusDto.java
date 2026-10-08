package com.agrivision.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SatelliteAnalysisStatusDto {

    private UUID id;
    private String status;
    private String sensor;
    private UUID studyAreaId;
    private String studyAreaName;
    private Integer progressPercentage;
    private String message;
    private Instant createdAt;
    private Instant completedAt;
    private String failureReason;
}
