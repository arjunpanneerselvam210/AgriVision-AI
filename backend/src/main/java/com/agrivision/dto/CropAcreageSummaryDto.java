package com.agrivision.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropAcreageSummaryDto {

    private Double paddyAreaHa;
    private Double paddyPercentage;
    private Long paddyFieldCount;

    private Double bananaAreaHa;
    private Double bananaPercentage;
    private Long bananaFieldCount;

    private Double otherAreaHa;
    private Double otherPercentage;
    private Long otherFieldCount;

    private Double totalAreaHa;
    private Long totalFieldsDetected;
}
