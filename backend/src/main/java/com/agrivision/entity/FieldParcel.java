package com.agrivision.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Geometry;

import java.util.UUID;

@Entity
@Table(name = "field_parcels", indexes = {
    @Index(name = "idx_field_parcels_segment_id", columnList = "segment_id"),
    @Index(name = "idx_field_parcels_study_area", columnList = "study_area_id"),
    @Index(name = "idx_field_parcels_crop_class", columnList = "crop_class")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldParcel extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "segment_id", nullable = false, length = 64)
    private String segmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_area_id", nullable = false)
    private StudyArea studyArea;

    @Transient
    private Geometry geometry;

    @Column(name = "geojson_geometry", columnDefinition = "TEXT")
    private String geojsonGeometry;

    @Column(name = "area_ha", nullable = false)
    private Double areaHa;

    @Column(name = "area_m2")
    private Double areaM2;

    @Column(name = "mean_ndvi")
    private Double meanNdvi;

    @Column(name = "mean_lswi")
    private Double meanLswi;

    @Column(name = "mean_ndwi")
    private Double meanNdwi;

    @Column(name = "mean_vh_db")
    private Double meanVhDb;

    @Column(name = "mean_vh_minus_vv_db")
    private Double meanVhMinusVvDb;

    @Enumerated(EnumType.STRING)
    @Column(name = "crop_class", nullable = false, length = 20)
    @Builder.Default
    private CropType cropClass = CropType.OTHER;

    @Column(name = "confidence")
    private Double confidence;

    @Column(length = 80)
    private String taluk;

    @Column(length = 80)
    private String village;
}
