package com.agrivision.service;

import com.agrivision.dto.CropAcreageSummaryDto;
import com.agrivision.dto.StudyAreaReportDto;
import com.agrivision.entity.MlModel;
import com.agrivision.entity.StudyArea;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.repository.FieldParcelRepository;
import com.agrivision.repository.MlModelRepository;
import com.agrivision.repository.SatelliteAnalysisRepository;
import com.agrivision.repository.StudyAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final StudyAreaRepository studyAreaRepository;
    private final FieldParcelRepository fieldParcelRepository;
    private final SatelliteAnalysisRepository satelliteAnalysisRepository;
    private final MlModelRepository mlModelRepository;
    private final CropClassificationService cropClassificationService;

    @Transactional(readOnly = true)
    public StudyAreaReportDto getReportByStudyArea(UUID studyAreaId) {
        StudyArea studyArea = studyAreaRepository.findById(studyAreaId)
                .orElseThrow(() -> new ResourceNotFoundException("Study area not found with id: " + studyAreaId));

        long fieldCount = fieldParcelRepository.countByStudyAreaId(studyAreaId);
        Double totalAreaHa = fieldParcelRepository.sumAreaHaByStudyAreaId(studyAreaId);
        if (totalAreaHa == null) totalAreaHa = 0.0;

        CropAcreageSummaryDto acreageSummary = cropClassificationService.getCropAcreageSummary(studyAreaId);

        Optional<Instant> latestSatelliteDate = satelliteAnalysisRepository.findLatestAcquisitionDateByStudyAreaId(studyAreaId);

        Optional<MlModel> bestModel = mlModelRepository.findFirstByActiveTrueOrderByOverallAccuracyDesc();

        return StudyAreaReportDto.builder()
                .studyAreaId(studyArea.getId())
                .studyAreaName(studyArea.getName())
                .state(studyArea.getState())
                .district(studyArea.getDistrict())
                .taluks(studyArea.getTaluks())
                .totalAreaKm2(studyArea.getTotalAreaKm2())
                .totalAreaHa(Math.round(totalAreaHa * 100.0) / 100.0)
                .fieldCount(fieldCount)
                .acreageSummary(acreageSummary)
                .latestSatelliteAcquisitionDate(latestSatelliteDate.orElse(null))
                .bestModelAccuracy(bestModel.map(MlModel::getOverallAccuracy).orElse(null))
                .bestModelAlgorithm(bestModel.map(MlModel::getAlgorithm).orElse(null))
                .generatedAt(Instant.now())
                .build();
    }
}
