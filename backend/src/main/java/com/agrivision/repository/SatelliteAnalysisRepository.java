package com.agrivision.repository;

import com.agrivision.entity.SatelliteAnalysis;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SatelliteAnalysisRepository extends JpaRepository<SatelliteAnalysis, UUID> {

    Page<SatelliteAnalysis> findByStudyAreaId(UUID studyAreaId, Pageable pageable);

    @Query("SELECT MAX(s.acquisitionDate) FROM SatelliteAnalysis s WHERE s.studyArea.id = :studyAreaId AND s.status = 'COMPLETED'")
    Optional<Instant> findLatestAcquisitionDateByStudyAreaId(@Param("studyAreaId") UUID studyAreaId);
}
