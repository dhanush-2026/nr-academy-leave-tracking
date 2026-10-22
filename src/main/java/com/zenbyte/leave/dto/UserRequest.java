package com.zenbyte.leave.dto;

import com.zenbyte.leave.entity.Role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserRequest(@NotBlank
        String username, String password, @NotNull
        Role role, Long employeeId, Boolean active) {}
