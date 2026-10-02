package com.zenbyte.leave.dto;
import jakarta.validation.constraints.*; import java.time.LocalDate;
public record LeaveCreateRequest(@NotNull LocalDate fromDate,@NotNull LocalDate toDate,@NotBlank String reason,String description) {}
