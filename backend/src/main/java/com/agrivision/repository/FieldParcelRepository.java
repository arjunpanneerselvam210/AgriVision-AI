package com.agrivision.repository;

import com.agrivision.entity.CropType;
import com.agrivision.entity.FieldParcel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FieldParcelRepository extends JpaRepository<FieldParcel, UUID>, JpaSpecificationExecutor<FieldParcel> {

    Page<FieldParcel> findByStudyAreaId(UUID studyAreaId, Pageable pageable);

    List<FieldParcel> findByStudyAreaId(UUID studyAreaId);

    Optional<FieldParcel> findBySegmentId(String segmentId);

    long countByStudyAreaId(UUID studyAreaId);

    long countByStudyAreaIdAndCropClass(UUID studyAreaId, CropType cropClass);

    @Query("SELECT COALESCE(SUM(f.areaHa), 0.0) FROM FieldParcel f WHERE f.studyArea.id = :studyAreaId")
    Double sumAreaHaByStudyAreaId(@Param("studyAreaId") UUID studyAreaId);

    @Query("SELECT COALESCE(SUM(f.areaHa), 0.0) FROM FieldParcel f WHERE f.studyArea.id = :studyAreaId AND f.cropClass = :cropClass")
    Double sumAreaHaByStudyAreaIdAndCropClass(@Param("studyAreaId") UUID studyAreaId, @Param("cropClass") CropType cropClass);
}
