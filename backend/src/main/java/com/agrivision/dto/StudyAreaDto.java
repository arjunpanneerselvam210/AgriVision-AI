package com.agrivision.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAreaDto {

    private UUID id;
    private String name;
    private String state;
    private String district;
    private String taluks;
    private Double totalAreaKm2;
    private Double targetMinAreaKm2;
    private String geojsonBoundary;
    private Instant createdAt;
    private Instant updatedAt;
}
