package com.agrivision.mapper;

import com.agrivision.dto.*;
import com.agrivision.entity.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKTReader;
import org.locationtech.jts.io.WKTWriter;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class EntityDtoMapper {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final WKTReader wktReader = new WKTReader();
    private final WKTWriter wktWriter = new WKTWriter();

    public UserDto toUserDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .organization(user.getOrganization())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public StudyAreaDto toStudyAreaDto(StudyArea studyArea) {
        if (studyArea == null) return null;
        return StudyAreaDto.builder()
                .id(studyArea.getId())
                .name(studyArea.getName())
                .state(studyArea.getState())
                .district(studyArea.getDistrict())
                .taluks(studyArea.getTaluks())
                .totalAreaKm2(studyArea.getTotalAreaKm2())
                .targetMinAreaKm2(studyArea.getTargetMinAreaKm2())
                .geojsonBoundary(studyArea.getGeojsonBoundary())
                .createdAt(studyArea.getCreatedAt())
                .updatedAt(studyArea.getUpdatedAt())
                .build();
    }

    public FieldParcelDto toFieldParcelDto(FieldParcel parcel) {
        if (parcel == null) return null;
        return FieldParcelDto.builder()
                .id(parcel.getId())
                .segmentId(parcel.getSegmentId())
                .studyAreaId(parcel.getStudyArea() != null ? parcel.getStudyArea().getId() : null)
                .studyAreaName(parcel.getStudyArea() != null ? parcel.getStudyArea().getName() : null)
                .areaHa(parcel.getAreaHa())
                .areaM2(parcel.getAreaM2())
                .meanNdvi(parcel.getMeanNdvi())
                .meanLswi(parcel.getMeanLswi())
                .meanNdwi(parcel.getMeanNdwi())
                .meanVhDb(parcel.getMeanVhDb())
                .meanVhMinusVvDb(parcel.getMeanVhMinusVvDb())
                .cropClass(parcel.getCropClass())
                .confidence(parcel.getConfidence())
                .modelVersion(parcel.getModelVersion())
                .satelliteAnalysisId(parcel.getSatelliteAnalysisId())
                .analysisDate(parcel.getAnalysisDate())
                .taluk(parcel.getTaluk())
                .village(parcel.getVillage())
                .geojsonGeometry(parcel.getGeojsonGeometry())
                .createdAt(parcel.getCreatedAt())
                .build();
    }

    public CropClassificationDto toCropClassificationDto(CropClassification c) {
        if (c == null) return null;
        return CropClassificationDto.builder()
                .id(c.getId())
                .studyAreaId(c.getStudyArea() != null ? c.getStudyArea().getId() : null)
                .fieldParcelId(c.getFieldParcel() != null ? c.getFieldParcel().getId() : null)
                .segmentId(c.getFieldParcel() != null ? c.getFieldParcel().getSegmentId() : null)
                .cropClass(c.getCropClass())
                .confidence(c.getConfidence())
                .modelId(c.getModelId())
                .classificationDate(c.getClassificationDate())
                .build();
    }

    public SatelliteAnalysisDto toSatelliteAnalysisDto(SatelliteAnalysis s) {
        if (s == null) return null;
        return SatelliteAnalysisDto.builder()
                .id(s.getId())
                .studyAreaId(s.getStudyArea() != null ? s.getStudyArea().getId() : null)
                .studyAreaName(s.getStudyArea() != null ? s.getStudyArea().getName() : null)
                .sensor(s.getSensor())
                .sceneId(s.getSceneId())
                .acquisitionDate(s.getAcquisitionDate())
                .cloudCover(s.getCloudCover())
                .processingLevel(s.getProcessingLevel())
                .status(s.getStatus())
                .parametersJson(s.getParametersJson())
                .metadataJson(s.getMetadataJson())
                .failureReason(s.getFailureReason())
                .completedAt(s.getCompletedAt())
                .createdAt(s.getCreatedAt())
                .build();
    }

    public MlModelDto toMlModelDto(MlModel m) {
        if (m == null) return null;
        return MlModelDto.builder()
                .id(m.getId())
                .name(m.getName())
                .algorithm(m.getAlgorithm())
                .version(m.getVersion())
                .treeCount(m.getTreeCount())
                .trainingSamplesCount(m.getTrainingSamplesCount())
                .validationSamplesCount(m.getValidationSamplesCount())
                .overallAccuracy(m.getOverallAccuracy())
                .kappa(m.getKappa())
                .weightedF1(m.getWeightedF1())
                .active(m.isActive())
                .createdAt(m.getCreatedAt())
                .build();
    }

    public ModelMetricsDto toModelMetricsDto(MlModel m) {
        if (m == null) return null;

        List<List<Integer>> confusionMatrix = Collections.emptyList();
        if (m.getConfusionMatrixJson() != null && !m.getConfusionMatrixJson().isBlank()) {
            try {
                confusionMatrix = objectMapper.readValue(m.getConfusionMatrixJson(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        Map<String, Double> featureImportance = Collections.emptyMap();
        if (m.getFeatureImportanceJson() != null && !m.getFeatureImportanceJson().isBlank()) {
            try {
                featureImportance = objectMapper.readValue(m.getFeatureImportanceJson(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }

        ModelAblationDto ablation = null;
        if (m.getAblationJson() != null && !m.getAblationJson().isBlank()) {
            try {
                ablation = objectMapper.readValue(m.getAblationJson(), ModelAblationDto.class);
            } catch (Exception ignored) {}
        }

        return ModelMetricsDto.builder()
                .modelId(m.getId())
                .modelName(m.getName())
                .algorithm(m.getAlgorithm())
                .overallAccuracy(m.getOverallAccuracy())
                .kappa(m.getKappa())
                .weightedF1(m.getWeightedF1())
                .confusionMatrix(confusionMatrix)
                .featureImportance(featureImportance)
                .ablation(ablation)
                .build();
    }

    public Geometry parseWkt(String wkt) {
        if (wkt == null || wkt.isBlank()) return null;
        try {
            Geometry geom = wktReader.read(wkt);
            geom.setSRID(4326);
            return geom;
        } catch (ParseException e) {
            return null;
        }
    }

    public String toWkt(Geometry geometry) {
        if (geometry == null) return null;
        return wktWriter.write(geometry);
    }
}
