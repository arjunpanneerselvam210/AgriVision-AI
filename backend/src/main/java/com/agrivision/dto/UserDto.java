package com.agrivision.dto;

import com.agrivision.entity.Role;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String email;
    private String fullName;
    private String organization;
    private Role role;
    private boolean active;
    private Instant createdAt;
}
