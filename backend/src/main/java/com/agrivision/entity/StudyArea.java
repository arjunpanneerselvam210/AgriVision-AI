package com.agrivision.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Geometry;

import java.util.UUID;

@Entity
@Table(name = "study_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyArea extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 80)
    private String district;

    @Column(nullable = false, length = 255)
    private String taluks; // e.g. "Ambasamudram, Cheranmahadevi"

    @Column(name = "total_area_km2")
    private Double totalAreaKm2;

    @Column(name = "target_min_area_km2", nullable = false)
    @Builder.Default
    private Double targetMinAreaKm2 = 20.0;

    @Transient
    private Geometry boundary;

    @Column(name = "geojson_boundary", columnDefinition = "TEXT")
    private String geojsonBoundary;
}
