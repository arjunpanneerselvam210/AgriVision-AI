package com.agrivision.service;

import com.agrivision.dto.CreateStudyAreaRequest;
import com.agrivision.dto.PageResponse;
import com.agrivision.dto.StudyAreaDto;
import com.agrivision.dto.UpdateStudyAreaRequest;
import com.agrivision.entity.StudyArea;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.StudyAreaRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StudyAreaService {

    private final StudyAreaRepository studyAreaRepository;
    private final EntityDtoMapper mapper;

    @Transactional
    public StudyAreaDto createStudyArea(CreateStudyAreaRequest request) {
        Geometry boundaryGeom = mapper.parseWkt(request.getWktBoundary());

        StudyArea studyArea = StudyArea.builder()
                .name(request.getName().trim())
                .state(request.getState().trim())
                .district(request.getDistrict().trim())
                .taluks(request.getTaluks().trim())
                .totalAreaKm2(request.getTotalAreaKm2())
                .targetMinAreaKm2(request.getTargetMinAreaKm2() != null ? request.getTargetMinAreaKm2() : 20.0)
                .boundary(boundaryGeom)
                .geojsonBoundary(request.getGeojsonBoundary())
                .build();

        StudyArea saved = studyAreaRepository.save(studyArea);
        return mapper.toStudyAreaDto(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<StudyAreaDto> getAllStudyAreas(Pageable pageable) {
        Page<StudyAreaDto> page = studyAreaRepository.findAll(pageable)
                .map(mapper::toStudyAreaDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public StudyAreaDto getStudyAreaById(UUID id) {
        StudyArea studyArea = studyAreaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study area not found with id: " + id));
        return mapper.toStudyAreaDto(studyArea);
    }

    @Transactional
    public StudyAreaDto updateStudyArea(UUID id, UpdateStudyAreaRequest request) {
        StudyArea studyArea = studyAreaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Study area not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            studyArea.setName(request.getName().trim());
        }
        if (request.getState() != null && !request.getState().isBlank()) {
            studyArea.setState(request.getState().trim());
        }
        if (request.getDistrict() != null && !request.getDistrict().isBlank()) {
            studyArea.setDistrict(request.getDistrict().trim());
        }
        if (request.getTaluks() != null && !request.getTaluks().isBlank()) {
            studyArea.setTaluks(request.getTaluks().trim());
        }
        if (request.getTotalAreaKm2() != null) {
            studyArea.setTotalAreaKm2(request.getTotalAreaKm2());
        }
        if (request.getTargetMinAreaKm2() != null) {
            studyArea.setTargetMinAreaKm2(request.getTargetMinAreaKm2());
        }
        if (request.getWktBoundary() != null) {
            studyArea.setBoundary(mapper.parseWkt(request.getWktBoundary()));
        }
        if (request.getGeojsonBoundary() != null) {
            studyArea.setGeojsonBoundary(request.getGeojsonBoundary());
        }

        StudyArea updated = studyAreaRepository.save(studyArea);
        return mapper.toStudyAreaDto(updated);
    }

    @Transactional
    public void deleteStudyArea(UUID id) {
        if (!studyAreaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Study area not found with id: " + id);
        }
        studyAreaRepository.deleteById(id);
    }
}
