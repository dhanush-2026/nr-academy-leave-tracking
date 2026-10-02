package com.zenbyte.leave.dto;
import com.zenbyte.leave.entity.AttendanceStatus; import jakarta.validation.constraints.*;
public record AttendanceUpdateRequest(@NotNull Long employeeId,@NotNull AttendanceStatus status) {}
