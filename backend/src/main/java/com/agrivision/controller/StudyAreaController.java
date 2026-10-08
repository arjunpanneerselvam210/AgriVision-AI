package com.agrivision.controller;

import com.agrivision.dto.*;
import com.agrivision.service.StudyAreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/study-areas")
@RequiredArgsConstructor
@Tag(name = "3. Study Area Management", description = "Endpoints for managing study area regions, boundaries, and extent thresholds")
public class StudyAreaController {

    private final StudyAreaService studyAreaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Create study area", description = "Defines a new agricultural study region (Requires ANALYST or ADMIN role)")
    public ResponseEntity<ApiResponse<StudyAreaDto>> createStudyArea(@Valid @RequestBody CreateStudyAreaRequest request) {
        StudyAreaDto created = studyAreaService.createStudyArea(request);
        return new ResponseEntity<>(ApiResponse.success("Study area created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List study areas", description = "Retrieves paginated and sorted list of study areas")
    public ResponseEntity<ApiResponse<PageResponse<StudyAreaDto>>> getAllStudyAreas(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<StudyAreaDto> response = studyAreaService.getAllStudyAreas(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get study area by ID", description = "Retrieves details of a specific study area including its boundary")
    public ResponseEntity<ApiResponse<StudyAreaDto>> getStudyAreaById(@PathVariable UUID id) {
        StudyAreaDto studyArea = studyAreaService.getStudyAreaById(id);
        return ResponseEntity.ok(ApiResponse.success(studyArea));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Update study area", description = "Modifies existing study area properties (Requires ANALYST or ADMIN role)")
    public ResponseEntity<ApiResponse<StudyAreaDto>> updateStudyArea(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStudyAreaRequest request) {
        StudyAreaDto updated = studyAreaService.updateStudyArea(id, request);
        return ResponseEntity.ok(ApiResponse.success("Study area updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete study area", description = "Removes a study area and related records (Requires ADMIN role)")
    public ResponseEntity<ApiResponse<Void>> deleteStudyArea(@PathVariable UUID id) {
        studyAreaService.deleteStudyArea(id);
        return ResponseEntity.ok(ApiResponse.success("Study area deleted successfully", null));
    }
}
