package com.zenbyte.leave.dto;

import com.zenbyte.leave.entity.LeaveStatus;

import jakarta.validation.constraints.NotNull;

public record LeaveActionRequest(@NotNull
        LeaveStatus status, String adminRemarks) {}
