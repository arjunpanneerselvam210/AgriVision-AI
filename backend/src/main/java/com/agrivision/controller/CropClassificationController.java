package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.CropAcreageSummaryDto;
import com.agrivision.dto.CropClassificationDto;
import com.agrivision.dto.PageResponse;
import com.agrivision.service.CropClassificationService;
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
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
@Tag(name = "5. Crop Classification", description = "Endpoints for retrieving machine-learning crop classifications and dynamic area summaries")
public class CropClassificationController {

    private final CropClassificationService cropClassificationService;

    @GetMapping
    @Operation(summary = "List crop classifications", description = "Retrieves paginated crop classification records")
    public ResponseEntity<ApiResponse<PageResponse<CropClassificationDto>>> getClassifications(
            @PageableDefault(size = 20, sort = "classificationDate", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<CropClassificationDto> response = cropClassificationService.getClassifications(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get crop classification by ID", description = "Retrieves a specific crop classification record")
    public ResponseEntity<ApiResponse<CropClassificationDto>> getClassificationById(@PathVariable UUID id) {
        CropClassificationDto dto = cropClassificationService.getClassificationById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/study-area/{studyAreaId}")
    @Operation(summary = "Get classifications by study area", description = "Retrieves paginated crop classifications for a specified study area")
    public ResponseEntity<ApiResponse<PageResponse<CropClassificationDto>>> getClassificationsByStudyArea(
            @PathVariable UUID studyAreaId,
            @PageableDefault(size = 20, sort = "classificationDate", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<CropClassificationDto> response = cropClassificationService.getClassificationsByStudyArea(studyAreaId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/study-area/{studyAreaId}/summary")
    @Operation(summary = "Get crop acreage summary for study area", description = "Calculates dynamic area totals and percentages for Paddy, Banana, and Other without hardcoding")
    public ResponseEntity<ApiResponse<CropAcreageSummaryDto>> getCropAcreageSummary(@PathVariable UUID studyAreaId) {
        CropAcreageSummaryDto summary = cropClassificationService.getCropAcreageSummary(studyAreaId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
