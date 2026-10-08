package com.agrivision.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAreaReportDto {

    private UUID studyAreaId;
    private String studyAreaName;
    private String state;
    private String district;
    private String taluks;
    private Double totalAreaKm2;
    private Double totalAreaHa;
    private Long fieldCount;
    private CropAcreageSummaryDto acreageSummary;
    private Instant latestSatelliteAcquisitionDate;
    private Double bestModelAccuracy;
    private String bestModelAlgorithm;
    private Instant generatedAt;
}
