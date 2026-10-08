package com.agrivision.service;

import com.agrivision.dto.CreateSatelliteAnalysisRequest;
import com.agrivision.dto.PageResponse;
import com.agrivision.dto.SatelliteAnalysisDto;
import com.agrivision.dto.SatelliteAnalysisStatusDto;
import com.agrivision.entity.SatelliteAnalysis;
import com.agrivision.entity.StudyArea;
import com.agrivision.exception.BadRequestException;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.SatelliteAnalysisRepository;
import com.agrivision.repository.StudyAreaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service managing satellite analysis lifecycle and metadata persistence.
 *
 * Architecture:
 * Controller -> SatelliteAnalysisService -> EarthEngineService -> Google Earth Engine
 *
 * Lifecycle:
 * REQUESTED -> PROCESSING -> COMPLETED or FAILED
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SatelliteAnalysisService {

    private final SatelliteAnalysisRepository satelliteAnalysisRepository;
    private final StudyAreaRepository studyAreaRepository;
    private final EarthEngineService earthEngineService;
    private final EntityDtoMapper mapper;
    private final ObjectMapper objectMapper;

    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Transactional(readOnly = true)
    public PageResponse<SatelliteAnalysisDto> getAnalyses(Pageable pageable) {
        Page<SatelliteAnalysisDto> page = satelliteAnalysisRepository.findAll(pageable)
                .map(mapper::toSatelliteAnalysisDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public SatelliteAnalysisDto getAnalysisById(UUID id) {
        SatelliteAnalysis analysis = satelliteAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite analysis not found with id: " + id));
        return mapper.toSatelliteAnalysisDto(analysis);
    }

    @Transactional(readOnly = true)
    public SatelliteAnalysisStatusDto getAnalysisStatus(UUID id) {
        SatelliteAnalysis analysis = satelliteAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite analysis not found with id: " + id));

        int progress = switch (analysis.getStatus()) {
            case "REQUESTED" -> 15;
            case "PROCESSING" -> 60;
            case "COMPLETED" -> 100;
            case "FAILED" -> 0;
            default -> 0;
        };

        String message = switch (analysis.getStatus()) {
            case "REQUESTED" -> "Analysis request submitted and queued for satellite pipeline execution";
            case "PROCESSING" -> "Google Earth Engine satellite pipeline actively processing scene data";
            case "COMPLETED" -> "Satellite analysis completed successfully";
            case "FAILED" -> analysis.getFailureReason() != null
                    ? "Analysis failed: " + analysis.getFailureReason()
                    : "Satellite analysis failed during Earth Engine processing";
            default -> "Status: " + analysis.getStatus();
        };

        return SatelliteAnalysisStatusDto.builder()
                .id(analysis.getId())
                .status(analysis.getStatus())
                .sensor(analysis.getSensor())
                .studyAreaId(analysis.getStudyArea() != null ? analysis.getStudyArea().getId() : null)
                .studyAreaName(analysis.getStudyArea() != null ? analysis.getStudyArea().getName() : null)
                .progressPercentage(progress)
                .message(message)
                .createdAt(analysis.getCreatedAt())
                .completedAt(analysis.getCompletedAt())
                .failureReason(analysis.getFailureReason())
                .build();
    }

    public SatelliteAnalysisDto createAnalysis(CreateSatelliteAnalysisRequest request) {
        log.info("Creating satellite analysis request for sensor: {}", request.getSensor());

        // Validate sensor
        String sensor = request.getSensor() != null ? request.getSensor().toUpperCase() : "";
        if (!sensor.contains("SENTINEL_1") && !sensor.contains("SENTINEL_2") && !sensor.equals("S1") && !sensor.equals("S2")) {
            throw new BadRequestException("Invalid sensor type '" + request.getSensor() + "'. Required: SENTINEL_1 or SENTINEL_2");
        }

        // Persist initial state: REQUESTED within committed transaction
        SatelliteAnalysis savedAnalysis = transactionTemplate.execute(status -> {
            StudyArea studyArea;
            if (request.getStudyAreaId() != null) {
                studyArea = studyAreaRepository.findById(request.getStudyAreaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Study area not found with id: " + request.getStudyAreaId()));
            } else {
                studyArea = studyAreaRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BadRequestException("No study area configured. Please specify studyAreaId"));
            }

            String parametersJson = null;
            try {
                parametersJson = objectMapper.writeValueAsString(request);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize request parameters: {}", e.getMessage());
            }

            Instant acquisitionDate = request.getAcquisitionDate() != null ? request.getAcquisitionDate() : Instant.now();
            String sceneId = request.getSceneId() != null
                    ? request.getSceneId()
                    : (sensor.contains("SENTINEL_2") ? "S2A_MSIL2A_" + System.currentTimeMillis() : "S1A_IW_GRDH_" + System.currentTimeMillis());

            SatelliteAnalysis analysis = SatelliteAnalysis.builder()
                    .studyArea(studyArea)
                    .sensor(sensor)
                    .sceneId(sceneId)
                    .acquisitionDate(acquisitionDate)
                    .cloudCover(request.getCloudCoverThreshold())
                    .processingLevel(sensor.contains("SENTINEL_2") ? "Level-2A BOA" : "GRD Sigma-0")
                    .status("REQUESTED")
                    .parametersJson(parametersJson)
                    .build();

            return satelliteAnalysisRepository.save(analysis);
        });

        if (savedAnalysis == null) {
            throw new RuntimeException("Failed to persist initial satellite analysis record");
        }

        log.info("Committed satellite analysis record with ID: {}, Status: REQUESTED", savedAnalysis.getId());

        // Asynchronously invoke Earth Engine processing pipeline
        dispatchProcessingAsync(savedAnalysis.getId(), request);

        return mapper.toSatelliteAnalysisDto(savedAnalysis);
    }

    /**
     * Dispatches Earth Engine processing asynchronously.
     * Transitions status: REQUESTED -> PROCESSING -> COMPLETED or FAILED.
     * Never pretends completion: only marks COMPLETED when GEE succeeds.
     */
    private void dispatchProcessingAsync(UUID analysisId, CreateSatelliteAnalysisRequest request) {
        CompletableFuture.runAsync(() -> {
            try {
                // Step 1: Transition to PROCESSING
                updateAnalysisStatus(analysisId, "PROCESSING", null, null);

                // Step 2: Fetch fresh entity and invoke EarthEngineService
                SatelliteAnalysis analysis = satelliteAnalysisRepository.findById(analysisId).orElse(null);
                if (analysis == null) {
                    log.error("Analysis record {} not found during async processing execution", analysisId);
                    return;
                }

                // Step 3: Execute Earth Engine pipeline
                String resultMetadataJson = earthEngineService.executeProcessing(analysis, request);

                // Step 4: Succeeded - Mark COMPLETED
                updateAnalysisStatus(analysisId, "COMPLETED", resultMetadataJson, null);
                log.info("Satellite analysis {} successfully marked COMPLETED", analysisId);

            } catch (Exception e) {
                // Processing failed or credentials missing - Mark FAILED (honoring strict lifecycle rule)
                log.error("Satellite analysis {} processing failed: {}", analysisId, e.getMessage());
                updateAnalysisStatus(analysisId, "FAILED", null, e.getMessage());
            }
        });
    }

    public void updateAnalysisStatus(UUID analysisId, String status, String metadataJson, String failureReason) {
        transactionTemplate.executeWithoutResult(txStatus -> {
            satelliteAnalysisRepository.findById(analysisId).ifPresent(analysis -> {
                analysis.setStatus(status);
                if (metadataJson != null) {
                    analysis.setMetadataJson(metadataJson);
                }
                if (failureReason != null) {
                    analysis.setFailureReason(failureReason);
                }
                if ("COMPLETED".equals(status)) {
                    analysis.setCompletedAt(Instant.now());
                }
                satelliteAnalysisRepository.save(analysis);
            });
        });
    }
}
