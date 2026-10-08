package com.agrivision.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "ml_models", indexes = {
    @Index(name = "idx_ml_models_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlModel extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 80)
    private String algorithm;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String version = "1.0.0";

    @Column(name = "tree_count")
    @Builder.Default
    private Integer treeCount = 100;

    @Column(name = "training_samples_count")
    private Integer trainingSamplesCount;

    @Column(name = "validation_samples_count")
    private Integer validationSamplesCount;

    @Column(name = "overall_accuracy")
    private Double overallAccuracy;

    @Column(name = "kappa_coefficient")
    private Double kappa;

    @Column(name = "weighted_f1")
    private Double weightedF1;

    @Column(name = "confusion_matrix_json", columnDefinition = "TEXT")
    private String confusionMatrixJson;

    @Column(name = "feature_importance_json", columnDefinition = "TEXT")
    private String featureImportanceJson;

    @Column(name = "ablation_json", columnDefinition = "TEXT")
    private String ablationJson;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
