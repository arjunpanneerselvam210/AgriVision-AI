package com.agrivision.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlModelDto {

    private UUID id;
    private String name;
    private String algorithm;
    private String version;
    private Integer treeCount;
    private Integer trainingSamplesCount;
    private Integer validationSamplesCount;
    private Double overallAccuracy;
    private Double kappa;
    private Double weightedF1;
    private boolean active;
    private Instant createdAt;
}
