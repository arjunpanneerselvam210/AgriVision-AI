package com.agrivision.config;

import com.agrivision.entity.Role;
import com.agrivision.entity.StudyArea;
import com.agrivision.entity.User;
import com.agrivision.repository.StudyAreaRepository;
import com.agrivision.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final StudyAreaRepository studyAreaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        initDefaultUsers();
        initDefaultStudyArea();
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

    private void initDefaultStudyArea() {
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

            studyAreaRepository.save(studyArea);
            log.info("Default study area registered: {}", studyArea.getName());
        }
    }
}
