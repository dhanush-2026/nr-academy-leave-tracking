package com.zenbyte.leave.dto;
import jakarta.validation.constraints.NotNull; import com.zenbyte.leave.entity.LeaveStatus;
public record LeaveActionRequest(@NotNull LeaveStatus status,String adminRemarks) {}
