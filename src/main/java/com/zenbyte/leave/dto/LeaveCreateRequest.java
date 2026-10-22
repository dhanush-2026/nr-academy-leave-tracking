package com.zenbyte.leave.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LeaveCreateRequest(@NotNull
        LocalDate fromDate, @NotNull
        LocalDate toDate, @NotBlank
        String reason, String description) {}
