package com.agrivision.repository;

import com.agrivision.entity.StudyArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyAreaRepository extends JpaRepository<StudyArea, UUID>, JpaSpecificationExecutor<StudyArea> {

    Optional<StudyArea> findByName(String name);
}
