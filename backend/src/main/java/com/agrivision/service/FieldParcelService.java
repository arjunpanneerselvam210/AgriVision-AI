package com.agrivision.service;

import com.agrivision.dto.FieldParcelDto;
import com.agrivision.dto.PageResponse;
import com.agrivision.entity.CropType;
import com.agrivision.entity.FieldParcel;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.FieldParcelRepository;
import com.agrivision.repository.StudyAreaRepository;
import com.agrivision.specification.FieldParcelSpecification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FieldParcelService {

    private final FieldParcelRepository fieldParcelRepository;
    private final StudyAreaRepository studyAreaRepository;
    private final EntityDtoMapper mapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public PageResponse<FieldParcelDto> getFields(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            String searchQuery,
            Pageable pageable) {
        return getFields(studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, null, null, searchQuery, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<FieldParcelDto> getFields(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            Double minConfidence,
            Double maxConfidence,
            String searchQuery,
            Pageable pageable) {

        Specification<FieldParcel> spec = FieldParcelSpecification.filter(
                studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, minConfidence, maxConfidence, searchQuery);

        Page<FieldParcelDto> page = fieldParcelRepository.findAll(spec, pageable)
                .map(mapper::toFieldParcelDto);

        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public FieldParcelDto getFieldById(UUID id) {
        FieldParcel parcel = fieldParcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field parcel not found with id: " + id));
        return mapper.toFieldParcelDto(parcel);
    }

    @Transactional(readOnly = true)
    public PageResponse<FieldParcelDto> getFieldsByStudyArea(UUID studyAreaId, Pageable pageable) {
        if (!studyAreaRepository.existsById(studyAreaId)) {
            throw new ResourceNotFoundException("Study area not found with id: " + studyAreaId);
        }

        Page<FieldParcelDto> page = fieldParcelRepository.findByStudyAreaId(studyAreaId, pageable)
                .map(mapper::toFieldParcelDto);

        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getFieldsGeoJson(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            Double minConfidence,
            Double maxConfidence,
            String searchQuery) {

        Specification<FieldParcel> spec = FieldParcelSpecification.filter(
                studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, minConfidence, maxConfidence, searchQuery);

        java.util.List<FieldParcel> parcels = fieldParcelRepository.findAll(spec);
        java.util.List<java.util.Map<String, Object>> features = new java.util.ArrayList<>();

        for (FieldParcel parcel : parcels) {
            String geoJsonString = parcel.getGeojsonGeometry();
            if (geoJsonString == null || geoJsonString.trim().isEmpty()) {
                // Strict adherence: do not generate fake field polygons
                continue;
            }

            try {
                Object geometryObj = objectMapper.readValue(geoJsonString, Object.class);

                java.util.Map<String, Object> feature = new java.util.LinkedHashMap<>();
                feature.put("type", "Feature");
                feature.put("id", parcel.getId().toString());
                feature.put("geometry", geometryObj);

                java.util.Map<String, Object> properties = new java.util.LinkedHashMap<>();
                properties.put("field_id", parcel.getSegmentId());
                properties.put("id", parcel.getId().toString());
                properties.put("segment_id", parcel.getSegmentId());
                properties.put("study_area_id", parcel.getStudyArea() != null ? parcel.getStudyArea().getId().toString() : null);
                properties.put("study_area_name", parcel.getStudyArea() != null ? parcel.getStudyArea().getName() : null);
                properties.put("area_ha", parcel.getAreaHa());
                properties.put("area_m2", parcel.getAreaM2());
                properties.put("predicted_crop", parcel.getCropClass() != null ? parcel.getCropClass().name() : "OTHER");
                properties.put("crop_class", parcel.getCropClass() != null ? parcel.getCropClass().name() : "OTHER");
                properties.put("crop_code", parcel.getCropClass() == CropType.PADDY ? 1 : parcel.getCropClass() == CropType.BANANA ? 2 : 0);
                properties.put("crop_name", parcel.getCropClass() == CropType.PADDY ? "Paddy" : parcel.getCropClass() == CropType.BANANA ? "Banana" : "Other");
                properties.put("confidence", parcel.getConfidence());
                properties.put("analysis_date", parcel.getAnalysisDate() != null ? parcel.getAnalysisDate().toString() : (parcel.getCreatedAt() != null ? parcel.getCreatedAt().toString() : null));
                properties.put("model_version", parcel.getModelVersion() != null ? parcel.getModelVersion() : "RF-v1.4-Fused");
                properties.put("satellite_analysis_id", parcel.getSatelliteAnalysisId() != null ? parcel.getSatelliteAnalysisId().toString() : null);
                properties.put("mean_ndvi", parcel.getMeanNdvi());
                properties.put("mean_lswi", parcel.getMeanLswi());
                properties.put("mean_ndwi", parcel.getMeanNdwi());
                properties.put("mean_vh_dB", parcel.getMeanVhDb());
                properties.put("mean_vh_minus_vv_dB", parcel.getMeanVhMinusVvDb());
                properties.put("taluk", parcel.getTaluk());
                properties.put("village", parcel.getVillage());

                feature.put("properties", properties);
                features.add(feature);
            } catch (Exception ignored) {
            }
        }

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("type", "FeatureCollection");
        result.put("features", features);
        result.put("totalFeatures", features.size());

        return result;
    }
}
