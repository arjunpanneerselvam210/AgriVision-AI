package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.PageResponse;
import com.agrivision.dto.SatelliteAnalysisDto;
import com.agrivision.service.SatelliteAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/satellite/analyses")
@RequiredArgsConstructor
@Tag(name = "6. Satellite Analysis", description = "Endpoints for viewing Sentinel-1 SAR and Sentinel-2 optical scene acquisitions and processing logs")
public class SatelliteAnalysisController {

    private final SatelliteAnalysisService satelliteAnalysisService;

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
}
