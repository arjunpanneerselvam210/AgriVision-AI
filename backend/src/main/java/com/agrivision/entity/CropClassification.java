package com.agrivision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "crop_classifications", indexes = {
    @Index(name = "idx_classifications_study_area", columnList = "study_area_id"),
    @Index(name = "idx_classifications_crop_class", columnList = "crop_class")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropClassification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_area_id", nullable = false)
    private StudyArea studyArea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_parcel_id")
    private FieldParcel fieldParcel;

    @Enumerated(EnumType.STRING)
    @Column(name = "crop_class", nullable = false, length = 20)
    private CropType cropClass;

    @Column(nullable = false)
    private Double confidence;

    @Column(name = "model_id")
    private UUID modelId;

    @Column(name = "classification_date", nullable = false)
    @Builder.Default
    private Instant classificationDate = Instant.now();
}
