package com.agrivision.service;

import com.agrivision.dto.UpdateUserRequest;
import com.agrivision.dto.UserDto;
import com.agrivision.entity.User;
import com.agrivision.exception.ResourceNotFoundException;
import com.agrivision.mapper.EntityDtoMapper;
import com.agrivision.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EntityDtoMapper mapper;

    @Transactional(readOnly = true)
    public UserDto getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapper.toUserDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getOrganization() != null) {
            user.setOrganization(request.getOrganization().trim());
        }

        User updatedUser = userRepository.save(user);
        return mapper.toUserDto(updatedUser);
    }
}
