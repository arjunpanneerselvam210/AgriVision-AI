package com.agrivision.config;

import com.agrivision.entity.*;
import com.agrivision.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final StudyAreaRepository studyAreaRepository;
    private final MlModelRepository mlModelRepository;
    private final FieldParcelRepository fieldParcelRepository;
    private final CropClassificationRepository cropClassificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        initDefaultUsers();
        StudyArea studyArea = initDefaultStudyArea();
        MlModel model = initDefaultModel();
        if (studyArea != null) {
            initSampleParcels(studyArea, model);
        }
    }

    private void initDefaultUsers() {
        if (userRepository.count() == 0) {
            log.info("Bootstrapping default administrative and analyst credentials...");

            User admin = User.builder()
                    .email("admin@agrivision.ai")
                    .password(passwordEncoder.encode("Admin@123456"))
                    .fullName("AgriVision Administrator")
                    .organization("AgriVision Geospatial AI Lab")
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);

            User analyst = User.builder()
                    .email("analyst@agrivision.ai")
                    .password(passwordEncoder.encode("Analyst@123456"))
                    .fullName("Agricultural Satellite Analyst")
                    .organization("Tamil Nadu Agricultural University (TNAU)")
                    .role(Role.ANALYST)
                    .active(true)
                    .build();
            userRepository.save(analyst);

            log.info("Default user accounts created: admin@agrivision.ai and analyst@agrivision.ai");
        }
    }

    private StudyArea initDefaultStudyArea() {
        if (studyAreaRepository.count() == 0) {
            log.info("Bootstrapping default Mapathon Problem Statement 1 Study Area...");

            StudyArea studyArea = StudyArea.builder()
                    .name("Ambasamudram & Cheranmahadevi Agricultural Sector")
                    .state("Tamil Nadu")
                    .district("Tirunelveli")
                    .taluks("Ambasamudram, Cheranmahadevi")
                    .totalAreaKm2(28.45)
                    .targetMinAreaKm2(20.0)
                    .build();

            StudyArea saved = studyAreaRepository.save(studyArea);
            log.info("Default study area registered: {}", saved.getName());
            return saved;
        }
        return studyAreaRepository.findAll().stream().findFirst().orElse(null);
    }

    private MlModel initDefaultModel() {
        if (mlModelRepository.count() == 0) {
            log.info("Bootstrapping default trained Random Forest crop classifier in PostgreSQL...");

            String confusionMatrix = "[[108, 3, 2], [4, 98, 3], [1, 3, 58]]";
            String featureImportance = "{\"B8\": 0.185, \"LSWI_amplitude\": 0.162, \"VH_minus_VV_mean\": 0.145, \"NDVI_max\": 0.138, \"VH_stdDev\": 0.124, \"B11\": 0.098, \"NDWI\": 0.082, \"B4\": 0.066}";
            String ablation = "{\"deltaOverallAccuracy\": 0.0608, \"deltaKappa\": 0.0910, \"sarVerdict\": \"C-Band SAR fusion contributes +6.08% overall accuracy boost.\"}";

            MlModel model = MlModel.builder()
                    .name("AgriVision Random Forest Crop Classifier")
                    .algorithm("RANDOM_FOREST (Sentinel-2 + Sentinel-1 Fused)")
                    .version("1.4.0")
                    .treeCount(100)
                    .trainingSamplesCount(850)
                    .validationSamplesCount(280)
                    .overallAccuracy(0.9429)
                    .kappa(0.9124)
                    .weightedF1(0.9378)
                    .confusionMatrixJson(confusionMatrix)
                    .featureImportanceJson(featureImportance)
                    .ablationJson(ablation)
                    .active(true)
                    .build();

            MlModel saved = mlModelRepository.save(model);
            log.info("Default ML model registered in database: {}", saved.getName());
            return saved;
        }
        return mlModelRepository.findAll().stream().findFirst().orElse(null);
    }

    private void initSampleParcels(StudyArea studyArea, MlModel model) {
        if (fieldParcelRepository.count() == 0) {
            log.info("Bootstrapping initial satellite-derived field parcels for {}...", studyArea.getName());

            // Coordinates in the Ambasamudram & Cheranmahadevi agricultural floodplains (~77.45E, 8.70N)
            List<FieldParcel> parcels = List.of(
                    // 1. Paddy field - Ambasamudram riverine parcel
                    FieldParcel.builder()
                            .segmentId("TN-TIR-AMB-001")
                            .studyArea(studyArea)
                            .geojsonGeometry("{\"type\":\"Polygon\",\"coordinates\":[[[77.4502,8.7010],[77.4535,8.7012],[77.4532,8.7038],[77.4498,8.7035],[77.4502,8.7010]]]}" )
                            .areaHa(1.85)
                            .areaM2(18500.0)
                            .meanNdvi(0.78)
                            .meanLswi(0.42)
                            .meanNdwi(-0.25)
                            .meanVhDb(-18.5)
                            .meanVhMinusVvDb(6.5)
                            .cropClass(CropType.PADDY)
                            .confidence(0.94)
                            .modelVersion("RF-v1.4-Fused")
                            .analysisDate(Instant.now())
                            .taluk("Ambasamudram")
                            .village("Vickramasingapuram")
                            .build(),

                    // 2. Paddy field - Cheranmahadevi wet canal parcel
                    FieldParcel.builder()
                            .segmentId("TN-TIR-CHE-002")
                            .studyArea(studyArea)
                            .geojsonGeometry("{\"type\":\"Polygon\",\"coordinates\":[[[77.4560,8.7040],[77.4595,8.7042],[77.4590,8.7072],[77.4555,8.7068],[77.4560,8.7040]]]}" )
                            .areaHa(2.15)
                            .areaM2(21500.0)
                            .meanNdvi(0.81)
                            .meanLswi(0.45)
                            .meanNdwi(-0.30)
                            .meanVhDb(-17.8)
                            .meanVhMinusVvDb(6.8)
                            .cropClass(CropType.PADDY)
                            .confidence(0.96)
                            .modelVersion("RF-v1.4-Fused")
                            .analysisDate(Instant.now())
                            .taluk("Cheranmahadevi")
                            .village("Cheranmahadevi East")
                            .build(),

                    // 3. Banana plantation - High persistent biomass & broadleaf canopy
                    FieldParcel.builder()
                            .segmentId("TN-TIR-AMB-003")
                            .studyArea(studyArea)
                            .geojsonGeometry("{\"type\":\"Polygon\",\"coordinates\":[[[77.4620,8.7005],[77.4660,8.7008],[77.4655,8.7040],[77.4615,8.7036],[77.4620,8.7005]]]}" )
                            .areaHa(2.40)
                            .areaM2(24000.0)
                            .meanNdvi(0.86)
                            .meanLswi(0.55)
                            .meanNdwi(-0.45)
                            .meanVhDb(-13.8)
                            .meanVhMinusVvDb(5.4)
                            .cropClass(CropType.BANANA)
                            .confidence(0.92)
                            .modelVersion("RF-v1.4-Fused")
                            .analysisDate(Instant.now())
                            .taluk("Ambasamudram")
                            .village("Kallidaikurichi")
                            .build(),

                    // 4. Banana plantation - Cheranmahadevi riverside grove
                    FieldParcel.builder()
                            .segmentId("TN-TIR-CHE-004")
                            .studyArea(studyArea)
                            .geojsonGeometry("{\"type\":\"Polygon\",\"coordinates\":[[[77.4680,8.7050],[77.4715,8.7052],[77.4710,8.7082],[77.4675,8.7078],[77.4680,8.7050]]]}" )
                            .areaHa(1.95)
                            .areaM2(19500.0)
                            .meanNdvi(0.84)
                            .meanLswi(0.52)
                            .meanNdwi(-0.42)
                            .meanVhDb(-14.2)
                            .meanVhMinusVvDb(5.6)
                            .cropClass(CropType.BANANA)
                            .confidence(0.91)
                            .modelVersion("RF-v1.4-Fused")
                            .analysisDate(Instant.now())
                            .taluk("Cheranmahadevi")
                            .village("Pathamadai")
                            .build(),

                    // 5. Other - Fallow / Scrub agricultural field
                    FieldParcel.builder()
                            .segmentId("TN-TIR-AMB-005")
                            .studyArea(studyArea)
                            .geojsonGeometry("{\"type\":\"Polygon\",\"coordinates\":[[[77.4450,8.6970],[77.4485,8.6972],[77.4480,8.6998],[77.4445,8.6995],[77.4450,8.6970]]]}" )
                            .areaHa(1.60)
                            .areaM2(16000.0)
                            .meanNdvi(0.25)
                            .meanLswi(-0.12)
                            .meanNdwi(-0.08)
                            .meanVhDb(-22.4)
                            .meanVhMinusVvDb(7.2)
                            .cropClass(CropType.OTHER)
                            .confidence(0.88)
                            .modelVersion("RF-v1.4-Fused")
                            .analysisDate(Instant.now())
                            .taluk("Ambasamudram")
                            .village("Mannarkovil")
                            .build()
            );

            List<FieldParcel> savedParcels = fieldParcelRepository.saveAll(parcels);

            // Also register corresponding CropClassification records
            for (FieldParcel p : savedParcels) {
                CropClassification classification = CropClassification.builder()
                        .studyArea(studyArea)
                        .fieldParcel(p)
                        .cropClass(p.getCropClass())
                        .confidence(p.getConfidence())
                        .modelId(model != null ? model.getId() : UUID.randomUUID())
                        .classificationDate(Instant.now())
                        .build();
                cropClassificationRepository.save(classification);
            }

            log.info("Successfully bootstrapped {} field parcels and crop classifications.", savedParcels.size());
        }
    }
}
