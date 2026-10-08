package com.agrivision.dto;

import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStudyAreaRequest {

    private String name;
    private String state;
    private String district;
    private String taluks;
    private Double totalAreaKm2;

    @Positive(message = "Target minimum area must be positive")
    private Double targetMinAreaKm2;

    private String wktBoundary;
    private String geojsonBoundary;
}
