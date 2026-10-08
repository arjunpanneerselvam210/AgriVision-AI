package com.agrivision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "satellite_analyses", indexes = {
    @Index(name = "idx_sat_analysis_study_area", columnList = "study_area_id"),
    @Index(name = "idx_sat_analysis_acquisition", columnList = "acquisition_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SatelliteAnalysis extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_area_id", nullable = false)
    private StudyArea studyArea;

    @Column(nullable = false, length = 60)
    private String sensor;

    @Column(name = "scene_id", length = 120)
    private String sceneId;

    @Column(name = "acquisition_date", nullable = false)
    private Instant acquisitionDate;

    @Column(name = "cloud_cover")
    private Double cloudCover;

    @Column(name = "processing_level", length = 50)
    private String processingLevel;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;
}
