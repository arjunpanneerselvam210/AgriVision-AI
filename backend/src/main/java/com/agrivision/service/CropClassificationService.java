package com.agrivision.service;

import com.agrivision.dto.CropAcreageSummaryDto;
import com.agrivision.dto.CropClassificationDto;
import com.agrivision.dto.PageResponse;
import com.agrivision.entity.CropClassification;
import com.agrivision.entity.CropType;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.CropClassificationRepository;
import com.agrivision.repository.FieldParcelRepository;
import com.agrivision.repository.StudyAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CropClassificationService {

    private final CropClassificationRepository cropClassificationRepository;
    private final FieldParcelRepository fieldParcelRepository;
    private final StudyAreaRepository studyAreaRepository;
    private final EntityDtoMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<CropClassificationDto> getClassifications(Pageable pageable) {
        Page<CropClassificationDto> page = cropClassificationRepository.findAll(pageable)
                .map(mapper::toCropClassificationDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public CropClassificationDto getClassificationById(UUID id) {
        CropClassification c = cropClassificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop classification not found with id: " + id));
        return mapper.toCropClassificationDto(c);
    }

    @Transactional(readOnly = true)
    public PageResponse<CropClassificationDto> getClassificationsByStudyArea(UUID studyAreaId, Pageable pageable) {
        if (!studyAreaRepository.existsById(studyAreaId)) {
            throw new ResourceNotFoundException("Study area not found with id: " + studyAreaId);
        }

        Page<CropClassificationDto> page = cropClassificationRepository.findByStudyAreaId(studyAreaId, pageable)
                .map(mapper::toCropClassificationDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public CropAcreageSummaryDto getCropAcreageSummary(UUID studyAreaId) {
        if (!studyAreaRepository.existsById(studyAreaId)) {
            throw new ResourceNotFoundException("Study area not found with id: " + studyAreaId);
        }

        long totalFields = fieldParcelRepository.countByStudyAreaId(studyAreaId);
        Double totalHa = fieldParcelRepository.sumAreaHaByStudyAreaId(studyAreaId);
        if (totalHa == null) totalHa = 0.0;

        Double paddyHa = fieldParcelRepository.sumAreaHaByStudyAreaIdAndCropClass(studyAreaId, CropType.PADDY);
        long paddyCount = fieldParcelRepository.countByStudyAreaIdAndCropClass(studyAreaId, CropType.PADDY);

        Double bananaHa = fieldParcelRepository.sumAreaHaByStudyAreaIdAndCropClass(studyAreaId, CropType.BANANA);
        long bananaCount = fieldParcelRepository.countByStudyAreaIdAndCropClass(studyAreaId, CropType.BANANA);

        Double otherHa = fieldParcelRepository.sumAreaHaByStudyAreaIdAndCropClass(studyAreaId, CropType.OTHER);
        long otherCount = fieldParcelRepository.countByStudyAreaIdAndCropClass(studyAreaId, CropType.OTHER);

        double paddyPct = totalHa > 0 ? (paddyHa / totalHa) * 100.0 : 0.0;
        double bananaPct = totalHa > 0 ? (bananaHa / totalHa) * 100.0 : 0.0;
        double otherPct = totalHa > 0 ? (otherHa / totalHa) * 100.0 : 0.0;

        return CropAcreageSummaryDto.builder()
                .totalFieldsDetected(totalFields)
                .totalAreaHa(Math.round(totalHa * 100.0) / 100.0)
                .paddyAreaHa(Math.round(paddyHa * 100.0) / 100.0)
                .paddyPercentage(Math.round(paddyPct * 100.0) / 100.0)
                .paddyFieldCount(paddyCount)
                .bananaAreaHa(Math.round(bananaHa * 100.0) / 100.0)
                .bananaPercentage(Math.round(bananaPct * 100.0) / 100.0)
                .bananaFieldCount(bananaCount)
                .otherAreaHa(Math.round(otherHa * 100.0) / 100.0)
                .otherPercentage(Math.round(otherPct * 100.0) / 100.0)
                .otherFieldCount(otherCount)
                .build();
    }
}
