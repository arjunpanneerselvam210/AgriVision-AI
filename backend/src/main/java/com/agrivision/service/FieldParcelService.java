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

    @Transactional(readOnly = true)
    public PageResponse<FieldParcelDto> getFields(
            UUID studyAreaId,
            CropType cropClass,
            Double minAreaHa,
            Double maxAreaHa,
            Double minNdvi,
            String searchQuery,
            Pageable pageable) {

        Specification<FieldParcel> spec = FieldParcelSpecification.filter(
                studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, searchQuery);

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
}
