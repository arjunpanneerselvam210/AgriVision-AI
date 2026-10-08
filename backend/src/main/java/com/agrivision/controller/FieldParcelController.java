package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.FieldParcelDto;
import com.agrivision.dto.PageResponse;
import com.agrivision.entity.CropType;
import com.agrivision.service.FieldParcelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/fields")
@RequiredArgsConstructor
@Tag(name = "4. Field/Parcel Management", description = "Endpoints for retrieving satellite-derived agricultural field/parcel-like segments")
public class FieldParcelController {

    private final FieldParcelService fieldParcelService;

    @GetMapping
    @Operation(summary = "Search and list field parcels", description = "Retrieves paginated field parcels with optional filters (crop class, area range, min NDVI, text search)")
    public ResponseEntity<ApiResponse<PageResponse<FieldParcelDto>>> getFields(
            @RequestParam(required = false) @Parameter(description = "Study area UUID") UUID studyAreaId,
            @RequestParam(required = false) @Parameter(description = "Filter by crop class (PADDY, BANANA, OTHER)") CropType cropClass,
            @RequestParam(required = false) @Parameter(description = "Minimum area in hectares") Double minAreaHa,
            @RequestParam(required = false) @Parameter(description = "Maximum area in hectares") Double maxAreaHa,
            @RequestParam(required = false) @Parameter(description = "Minimum mean NDVI value") Double minNdvi,
            @RequestParam(required = false) @Parameter(description = "Search query matching segment ID, village, or taluk") String search,
            @PageableDefault(size = 20, sort = "areaHa", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<FieldParcelDto> response = fieldParcelService.getFields(
                studyAreaId, cropClass, minAreaHa, maxAreaHa, minNdvi, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get field parcel by ID", description = "Retrieves segment details, spectral statistics, and geometry for a specific parcel")
    public ResponseEntity<ApiResponse<FieldParcelDto>> getFieldById(@PathVariable UUID id) {
        FieldParcelDto parcel = fieldParcelService.getFieldById(id);
        return ResponseEntity.ok(ApiResponse.success(parcel));
    }

    @GetMapping("/study-area/{studyAreaId}")
    @Operation(summary = "Get fields by study area", description = "Retrieves paginated field parcels belonging to a given study area")
    public ResponseEntity<ApiResponse<PageResponse<FieldParcelDto>>> getFieldsByStudyArea(
            @PathVariable UUID studyAreaId,
            @PageableDefault(size = 20, sort = "areaHa", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<FieldParcelDto> response = fieldParcelService.getFieldsByStudyArea(studyAreaId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
