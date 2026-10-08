package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.CreateSatelliteAnalysisRequest;
import com.agrivision.dto.PageResponse;
import com.agrivision.dto.SatelliteAnalysisDto;
import com.agrivision.dto.SatelliteAnalysisStatusDto;
import com.agrivision.service.SatelliteAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/satellite/analyses")
@RequiredArgsConstructor
@Tag(name = "6. Satellite Analysis", description = "Endpoints for initiating and monitoring Sentinel-1 SAR and Sentinel-2 optical Earth Engine analyses")
public class SatelliteAnalysisController {

    private final SatelliteAnalysisService satelliteAnalysisService;

    @PostMapping
    @Operation(summary = "Request satellite analysis", description = "Creates a new satellite analysis job for Sentinel-1 or Sentinel-2 with full Earth Engine pipeline parameters")
    public ResponseEntity<ApiResponse<SatelliteAnalysisDto>> createAnalysis(
            @Valid @RequestBody CreateSatelliteAnalysisRequest request) {
        SatelliteAnalysisDto dto = satelliteAnalysisService.createAnalysis(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Satellite analysis initiated", dto));
    }

    @GetMapping
    @Operation(summary = "List satellite analyses", description = "Retrieves paginated satellite scene ingestion and processing records")
    public ResponseEntity<ApiResponse<PageResponse<SatelliteAnalysisDto>>> getAnalyses(
            @PageableDefault(size = 20, sort = "acquisitionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<SatelliteAnalysisDto> response = satelliteAnalysisService.getAnalyses(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get satellite analysis by ID", description = "Retrieves detailed information about a specific satellite analysis record")
    public ResponseEntity<ApiResponse<SatelliteAnalysisDto>> getAnalysisById(@PathVariable UUID id) {
        SatelliteAnalysisDto dto = satelliteAnalysisService.getAnalysisById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/{id}/status")
    @Operation(summary = "Get satellite analysis processing status", description = "Retrieves real-time processing status (REQUESTED, PROCESSING, COMPLETED, FAILED) and progress metadata")
    public ResponseEntity<ApiResponse<SatelliteAnalysisStatusDto>> getAnalysisStatus(@PathVariable UUID id) {
        SatelliteAnalysisStatusDto status = satelliteAnalysisService.getAnalysisStatus(id);
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
