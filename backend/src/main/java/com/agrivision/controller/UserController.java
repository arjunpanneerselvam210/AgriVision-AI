package com.agrivision.controller;

import com.agrivision.dto.ApiResponse;
import com.agrivision.dto.UpdateUserRequest;
import com.agrivision.dto.UserDto;
import com.agrivision.security.UserPrincipal;
import com.agrivision.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "2. User Management", description = "Endpoints for viewing and updating user profiles")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get user profile", description = "Fetches authenticated user profile information")
    public ResponseEntity<ApiResponse<UserDto>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = userService.getUserProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/me")
    @Operation(summary = "Update user profile", description = "Updates authenticated user profile fields such as full name and organization")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto updated = userService.updateUserProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }
}
