package com.agrivision.repository;

import com.agrivision.entity.CropClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CropClassificationRepository extends JpaRepository<CropClassification, UUID> {

    Page<CropClassification> findByStudyAreaId(UUID studyAreaId, Pageable pageable);

    List<CropClassification> findByStudyAreaId(UUID studyAreaId);
}
