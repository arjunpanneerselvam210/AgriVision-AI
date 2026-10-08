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
public class FieldParcelDto {

    private UUID id;
    private String segmentId;
    private UUID studyAreaId;
    private String studyAreaName;
    private Double areaHa;
    private Double areaM2;
    private Double meanNdvi;
    private Double meanLswi;
    private Double meanNdwi;
    private Double meanVhDb;
    private Double meanVhMinusVvDb;
    private CropType cropClass;
    private Double confidence;
    private String taluk;
    private String village;
    private String geojsonGeometry;
    private Instant createdAt;
}
