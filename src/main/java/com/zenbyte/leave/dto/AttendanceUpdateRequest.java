package com.zenbyte.leave.dto;

import com.zenbyte.leave.entity.AttendanceStatus;

import jakarta.validation.constraints.NotNull;

public record AttendanceUpdateRequest(@NotNull
        Long employeeId, @NotNull
        AttendanceStatus status) {}
