package com.zenbyte.leave.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank
        String username, @NotBlank
        String password) {}
