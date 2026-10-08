package com.agrivision.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelAblationDto {

    private String modelAName;
    private List<String> modelAFeatures;
    private Double modelAAccuracy;
    private Double modelAKappa;

    private String modelBName;
    private List<String> modelBFeatures;
    private Double modelBAccuracy;
    private Double modelBKappa;

    private Double deltaAccuracy;
    private Double deltaKappa;
    private String sarVerdict;
}
