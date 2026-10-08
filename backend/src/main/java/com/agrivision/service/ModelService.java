package com.agrivision.service;

import com.agrivision.dto.MlModelDto;
import com.agrivision.dto.ModelMetricsDto;
import com.agrivision.entity.MlModel;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.MlModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModelService {

    private final MlModelRepository mlModelRepository;
    private final EntityDtoMapper mapper;

    @Transactional(readOnly = true)
    public List<MlModelDto> getModels() {
        return mlModelRepository.findAll().stream()
                .map(mapper::toMlModelDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MlModelDto getModelById(UUID id) {
        MlModel model = mlModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ML Model not found with id: " + id));
        return mapper.toMlModelDto(model);
    }

    @Transactional(readOnly = true)
    public ModelMetricsDto getModelMetrics(UUID id) {
        MlModel model = mlModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ML Model not found with id: " + id));
        return mapper.toModelMetricsDto(model);
    }
}
