package com.agrivision.dto;

import com.agrivision.entity.CropType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropClassificationDto {

    private UUID id;
    private UUID studyAreaId;
    private UUID fieldParcelId;
    private String segmentId;
    private CropType cropClass;
    private Double confidence;
    private UUID modelId;
    private Instant classificationDate;
}
