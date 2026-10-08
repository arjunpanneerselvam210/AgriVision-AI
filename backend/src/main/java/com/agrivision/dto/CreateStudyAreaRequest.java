package com.agrivision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStudyAreaRequest {

    @NotBlank(message = "Study area name is required")
    private String name;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "District is required")
    private String district;

    @NotBlank(message = "Taluks are required")
    private String taluks;

    private Double totalAreaKm2;

    @NotNull(message = "Target minimum area is required")
    @Positive(message = "Target minimum area must be positive")
    @Builder.Default
    private Double targetMinAreaKm2 = 20.0;

    private String wktBoundary;
    private String geojsonBoundary;
}
