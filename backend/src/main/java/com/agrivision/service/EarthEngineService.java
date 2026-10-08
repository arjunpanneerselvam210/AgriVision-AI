package com.agrivision.service;

import com.agrivision.dto.CreateSatelliteAnalysisRequest;
import com.agrivision.entity.SatelliteAnalysis;
import com.agrivision.exception.EarthEngineProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Service encapsulating Google Earth Engine (GEE) integration for Sentinel-1 and Sentinel-2 processing.
 *
 * Supports:
 * - Sentinel-2: Cloud masking (SCL/QA60), temporal compositing (median/mosaic), spectral bands (B2-B12),
 *   vegetation/water indices (NDVI, NDWI, LSWI), and temporal greenness features.
 * - Sentinel-1: GRD VV &amp; VH backscatter, VV/VH cross-polarization relationship, and temporal statistics (mean, stdDev, min, max).
 *
 * Adheres strictly to the architectural constraint that Earth Engine logic is isolated here
 * and that processing is NEVER falsely marked COMPLETED without actual GEE success.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EarthEngineService {

    private final ObjectMapper objectMapper;

    @Value("${earth-engine.project-id:}")
    private String eeProjectId;

    @Value("${earth-engine.service-account-key:}")
    private String eeServiceAccountKey;

    @Value("${earth-engine.api-endpoint:https://earthengine.googleapis.com/v1beta}")
    private String eeApiEndpoint;

    @Value("${earth-engine.enabled:false}")
    private boolean eeEnabled;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Executes the Earth Engine processing workflow for the specified analysis record.
     *
     * @param analysis The analysis entity to process.
     * @param request  The user-specified processing request parameters.
     * @return Result metadata JSON string to store in PostgreSQL.
     * @throws EarthEngineProcessingException if Earth Engine authentication fails, credentials are missing, or processing fails.
     */
    public String executeProcessing(SatelliteAnalysis analysis, CreateSatelliteAnalysisRequest request) {
        log.info("Starting Earth Engine processing for analysis ID: {}, Sensor: {}", analysis.getId(), analysis.getSensor());

        // Validate Earth Engine Configuration
        if (!eeEnabled || eeProjectId == null || eeProjectId.trim().isEmpty()) {
            String errorMsg = String.format(
                    "Google Earth Engine processing cannot complete: Earth Engine service is not configured with active credentials (project-id: '%s', enabled: %b). Per system requirement, analysis will not be falsely marked COMPLETED.",
                    eeProjectId, eeEnabled
            );
            log.warn(errorMsg);
            throw new EarthEngineProcessingException(errorMsg);
        }

        // Build Earth Engine pipeline specification depending on sensor type
        String sensor = analysis.getSensor() != null ? analysis.getSensor().toUpperCase() : "SENTINEL_2";
        Map<String, Object> pipelineSpec;

        if (sensor.contains("SENTINEL_1") || sensor.equals("S1")) {
            pipelineSpec = buildSentinel1Pipeline(analysis, request);
        } else {
            pipelineSpec = buildSentinel2Pipeline(analysis, request);
        }

        // Dispatch to Google Earth Engine REST API
        return dispatchToEarthEngine(analysis, pipelineSpec);
    }

    /**
     * Constructs Sentinel-2 processing pipeline specification:
     * - Cloud masking (SCL Scene Classification Layer or QA60 bitmask)
     * - Temporal composites (Median / Greenest Pixel / Cloud-free mosaic)
     * - Spectral bands (B2 Blue, B3 Green, B4 Red, B5-B7 Red Edge, B8 NIR, B8A Narrow NIR, B11 SWIR1, B12 SWIR2)
     * - Vegetation and water indices: NDVI, NDWI, LSWI
     * - Temporal trajectory features
     */
    public Map<String, Object> buildSentinel2Pipeline(SatelliteAnalysis analysis, CreateSatelliteAnalysisRequest request) {
        Map<String, Object> pipeline = new LinkedHashMap<>();
        pipeline.put("collection", "COPERNICUS/S2_SR_HARMONIZED");
        pipeline.put("sensor", "Sentinel-2 MSI Level-2A");

        // Study area boundary filtering
        if (analysis.getStudyArea() != null && analysis.getStudyArea().getBoundary() != null) {
            pipeline.put("geometryWkt", analysis.getStudyArea().getBoundary().toText());
        }

        // Temporal window
        Instant start = request.getStartDate() != null ? request.getStartDate() : analysis.getAcquisitionDate().minus(Duration.ofDays(30));
        Instant end = request.getEndDate() != null ? request.getEndDate() : analysis.getAcquisitionDate().plus(Duration.ofDays(5));
        pipeline.put("dateRange", Map.of("start", start.toString(), "end", end.toString()));

        // Cloud Masking Configuration
        boolean maskClouds = request.getMaskClouds() == null || request.getMaskClouds();
        double cloudThreshold = request.getCloudCoverThreshold() != null ? request.getCloudCoverThreshold() : 20.0;
        pipeline.put("cloudMasking", Map.of(
                "enabled", maskClouds,
                "algorithm", "SCL_AND_QA60_MASK",
                "cloudCoverMaxPercent", cloudThreshold,
                "maskedClasses", List.of("3_CLOUD_SHADOWS", "8_CLOUD_MEDIUM_PROB", "9_CLOUD_HIGH_PROB", "10_THIN_CIRRUS")
        ));

        // Temporal Compositing
        String compositeMethod = request.getCompositeMethod() != null ? request.getCompositeMethod().toUpperCase() : "MEDIAN";
        pipeline.put("temporalComposite", Map.of(
                "method", compositeMethod,
                "description", "Cloud-masked temporal reducer over date range"
        ));

        // Spectral Bands
        List<String> spectralBands = request.getBands() != null && !request.getBands().isEmpty()
                ? request.getBands()
                : List.of("B2", "B3", "B4", "B5", "B6", "B7", "B8", "B8A", "B11", "B12");
        pipeline.put("spectralBands", spectralBands);

        // Vegetation & Water Indices
        List<String> requestedIndices = request.getIndices() != null && !request.getIndices().isEmpty()
                ? request.getIndices()
                : List.of("NDVI", "NDWI", "LSWI");
        Map<String, String> indexFormulas = new LinkedHashMap<>();
        if (requestedIndices.contains("NDVI")) {
            indexFormulas.put("NDVI", "(B8 - B4) / (B8 + B4)");
        }
        if (requestedIndices.contains("NDWI")) {
            indexFormulas.put("NDWI", "(B3 - B8) / (B3 + B8)");
        }
        if (requestedIndices.contains("LSWI")) {
            indexFormulas.put("LSWI", "(B8 - B11) / (B8 + B11)");
        }
        pipeline.put("indices", indexFormulas);

        // Temporal features
        if (Boolean.TRUE.equals(request.getCalculateTemporalStatistics())) {
            pipeline.put("temporalFeatures", Map.of(
                    "metrics", List.of("NDVI_MAX", "NDVI_MEAN", "NDVI_VARIANCE", "GREENNESS_RATE_OF_CHANGE"),
                    "temporalSteps", "BI_WEEKLY"
            ));
        }

        return pipeline;
    }

    /**
     * Constructs Sentinel-1 SAR processing pipeline specification:
     * - Polarization bands: VV, VH (Interferometric Wide Swath IW mode, GRD)
     * - Radiometric terrain correction &amp; calibration to decibels (dB)
     * - VV/VH relationships: Cross-polarization ratio (VH / VV), (VV - VH dB difference)
     * - Temporal statistics: mean VV, mean VH, standard deviation, temporal variance, min, max
     */
    public Map<String, Object> buildSentinel1Pipeline(SatelliteAnalysis analysis, CreateSatelliteAnalysisRequest request) {
        Map<String, Object> pipeline = new LinkedHashMap<>();
        pipeline.put("collection", "COPERNICUS/S1_GRD");
        pipeline.put("sensor", "Sentinel-1 SAR C-Band GRD");
        pipeline.put("mode", "IW");
        pipeline.put("polarization", List.of("VV", "VH"));

        // Study area boundary filtering
        if (analysis.getStudyArea() != null && analysis.getStudyArea().getBoundary() != null) {
            pipeline.put("geometryWkt", analysis.getStudyArea().getBoundary().toText());
        }

        // Temporal window
        Instant start = request.getStartDate() != null ? request.getStartDate() : analysis.getAcquisitionDate().minus(Duration.ofDays(30));
        Instant end = request.getEndDate() != null ? request.getEndDate() : analysis.getAcquisitionDate().plus(Duration.ofDays(5));
        pipeline.put("dateRange", Map.of("start", start.toString(), "end", end.toString()));

        // Calibration & Preprocessing
        pipeline.put("preprocessing", Map.of(
                "calibration", "SIGMA0_DB",
                "speckleFilter", "LEE_SIGMA",
                "terrainCorrection", "SRTM30"
        ));

        // Polarimetric relationships
        if (Boolean.TRUE.equals(request.getCalculateRadarRatios())) {
            pipeline.put("polarimetricRelationships", Map.of(
                    "VH_VV_Ratio", "VH_linear / VV_linear",
                    "VV_VH_Difference_dB", "VV_dB - VH_dB",
                    "Normalized_Difference_Pol", "(VV - VH) / (VV + VH)"
            ));
        }

        // Temporal statistics
        if (Boolean.TRUE.equals(request.getCalculateTemporalStatistics())) {
            pipeline.put("temporalStatistics", Map.of(
                    "aggregations", List.of("MEAN_VV", "MEAN_VH", "STDDEV_VV", "STDDEV_VH", "MIN_VV", "MAX_VV", "MIN_VH", "MAX_VH"),
                    "temporalComposite", request.getCompositeMethod() != null ? request.getCompositeMethod() : "MEDIAN"
            ));
        }

        return pipeline;
    }

    /**
     * Dispatches the pipeline computation request to the Google Earth Engine REST API.
     */
    private String dispatchToEarthEngine(SatelliteAnalysis analysis, Map<String, Object> pipelineSpec) {
        try {
            String requestPayload = objectMapper.writeValueAsString(Map.of(
                    "expression", pipelineSpec,
                    "analysisId", analysis.getId().toString()
            ));

            String url = String.format("%s/projects/%s/image:computePixels", eeApiEndpoint, eeProjectId);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + eeServiceAccountKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Earth Engine processing succeeded for analysis ID: {}", analysis.getId());
                Map<String, Object> resultMetadata = new LinkedHashMap<>();
                resultMetadata.put("geeResponseStatus", response.statusCode());
                resultMetadata.put("geePipeline", pipelineSpec);
                resultMetadata.put("processedAt", Instant.now().toString());
                resultMetadata.put("geeResponseBody", response.body());
                return objectMapper.writeValueAsString(resultMetadata);
            } else {
                String error = String.format("Earth Engine returned HTTP %d: %s", response.statusCode(), response.body());
                log.error("Earth Engine processing failed: {}", error);
                throw new EarthEngineProcessingException(error);
            }
        } catch (EarthEngineProcessingException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to communicate with Google Earth Engine: {}", e.getMessage(), e);
            throw new EarthEngineProcessingException("Earth Engine communication failure: " + e.getMessage(), e);
        }
    }
}
