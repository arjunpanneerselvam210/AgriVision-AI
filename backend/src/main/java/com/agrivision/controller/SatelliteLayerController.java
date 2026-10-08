package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/satellite")
@RequiredArgsConstructor
@Tag(name = "6. Satellite Analysis", description = "Endpoints for satellite layer configurations and temporal phenology profiles")
public class SatelliteLayerController {

    @GetMapping("/layers")
    @Operation(summary = "Get available satellite layer options", description = "Returns available Sentinel-2 optical and Sentinel-1 SAR visualization configurations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSatelliteLayers() {
        List<Map<String, Object>> layers = List.of(
                Map.of(
                        "id", "s2_rgb",
                        "name", "Sentinel-2 True Color (B4/B3/B2)",
                        "sensor", "Sentinel-2",
                        "type", "RGB",
                        "description", "Surface reflectance visual spectrum at 10m spatial resolution",
                        "bands", List.of("B4", "B3", "B2"),
                        "active", true
                ),
                Map.of(
                        "id", "s2_cir",
                        "name", "Sentinel-2 Color Infrared (B8/B4/B3)",
                        "sensor", "Sentinel-2",
                        "type", "CIR",
                        "description", "Near-infrared false color highlighting vegetative photosynthetic vigor",
                        "bands", List.of("B8", "B4", "B3"),
                        "active", false
                ),
                Map.of(
                        "id", "s2_phenology",
                        "name", "Phenological False Color (Max/Amp/Min)",
                        "sensor", "Sentinel-2",
                        "type", "Phenology",
                        "description", "Red: NDVI Max, Green: NDVI Amplitude, Blue: NDVI Min (Paddy vs Banana discriminator)",
                        "bands", List.of("NDVI_max", "NDVI_amplitude", "NDVI_min"),
                        "active", false
                ),
                Map.of(
                        "id", "s1_sar",
                        "name", "Sentinel-1 C-Band SAR (VV/VH/Diff)",
                        "sensor", "Sentinel-1",
                        "type", "SAR",
                        "description", "Dual-polarization surface roughness and broadleaf volumetric canopy scattering",
                        "bands", List.of("VV_mean", "VH_mean", "VH_minus_VV_dB"),
                        "active", false
                )
        );

        return ResponseEntity.ok(ApiResponse.success(layers));
    }

    @GetMapping("/temporal")
    @Operation(summary = "Get temporal phenology profile", description = "Returns multi-temporal composite time-series (NDVI, NDWI, LSWI) across the cultivation season")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTemporalProfile(
            @RequestParam(required = false, name = "parcel_id") String parcelId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        List<Map<String, Object>> series = List.of(
                Map.of("date", "2023-09-15", "timestamp", 1694736000000L, "periodLabel", "Sep 2023", "ndvi", 0.28, "ndwi", 0.15, "lswi", 0.35, "sceneCount", 4),
                Map.of("date", "2023-10-15", "timestamp", 1697328000000L, "periodLabel", "Oct 2023 (Transplant)", "ndvi", 0.32, "ndwi", 0.22, "lswi", 0.48, "sceneCount", 5),
                Map.of("date", "2023-11-15", "timestamp", 1700006400000L, "periodLabel", "Nov 2023 (Tillering)", "ndvi", 0.58, "ndwi", -0.10, "lswi", 0.42, "sceneCount", 6),
                Map.of("date", "2023-12-15", "timestamp", 1702598400000L, "periodLabel", "Dec 2023 (Heading)", "ndvi", 0.81, "ndwi", -0.32, "lswi", 0.38, "sceneCount", 4),
                Map.of("date", "2024-01-15", "timestamp", 1705276800000L, "periodLabel", "Jan 2024 (Ripening)", "ndvi", 0.74, "ndwi", -0.40, "lswi", 0.26, "sceneCount", 5),
                Map.of("date", "2024-02-15", "timestamp", 1707955200000L, "periodLabel", "Feb 2024 (Harvest)", "ndvi", 0.38, "ndwi", -0.18, "lswi", 0.12, "sceneCount", 5),
                Map.of("date", "2024-03-15", "timestamp", 1710460800000L, "periodLabel", "Mar 2024 (Fallow)", "ndvi", 0.24, "ndwi", -0.08, "lswi", -0.05, "sceneCount", 6),
                Map.of("date", "2024-04-15", "timestamp", 1713139200000L, "periodLabel", "Apr 2024", "ndvi", 0.22, "ndwi", -0.05, "lswi", -0.08, "sceneCount", 5)
        );

        Map<String, Object> metrics = Map.of(
                "ndviMean", 0.45,
                "ndviMin", 0.22,
                "ndviMax", 0.81,
                "ndviAmplitude", 0.59,
                "ndviStdDev", 0.23
        );

        Map<String, Object> response = new LinkedHashMap<>();
        if (parcelId != null) response.put("parcelId", parcelId);
        if (lat != null && lng != null) response.put("coordinates", List.of(lng, lat));
        response.put("cropType", "Paddy (Seasonal Wetland Inundation Trajectory)");
        response.put("series", series);
        response.put("metrics", metrics);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
