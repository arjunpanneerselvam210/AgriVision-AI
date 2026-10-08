package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.StudyAreaReportDto;
import com.agrivision.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "8. Reports", description = "Endpoints for generating comprehensive agricultural intelligence reports and zonal statistics")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/study-area/{studyAreaId}")
    @Operation(summary = "Get agricultural report for study area", description = "Compiles zonal extent, parcel count, crop-wise acreage statistics, latest satellite acquisition, and best model performance")
    public ResponseEntity<ApiResponse<StudyAreaReportDto>> getReportByStudyArea(@PathVariable UUID studyAreaId) {
        StudyAreaReportDto report = reportService.getReportByStudyArea(studyAreaId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
