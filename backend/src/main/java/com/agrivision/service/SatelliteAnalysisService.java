package com.agrivision.service;

import com.agrivision.dto.PageResponse;
import com.agrivision.dto.SatelliteAnalysisDto;
import com.agrivision.entity.SatelliteAnalysis;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.SatelliteAnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SatelliteAnalysisService {

    private final SatelliteAnalysisRepository satelliteAnalysisRepository;
    private final EntityDtoMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<SatelliteAnalysisDto> getAnalyses(Pageable pageable) {
        Page<SatelliteAnalysisDto> page = satelliteAnalysisRepository.findAll(pageable)
                .map(mapper::toSatelliteAnalysisDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public SatelliteAnalysisDto getAnalysisById(UUID id) {
        SatelliteAnalysis analysis = satelliteAnalysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite analysis not found with id: " + id));
        return mapper.toSatelliteAnalysisDto(analysis);
    }
}
