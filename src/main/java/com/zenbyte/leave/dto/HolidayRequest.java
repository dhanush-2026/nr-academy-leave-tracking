package com.zenbyte.leave.dto;
import jakarta.validation.constraints.*; import java.time.LocalDate;
public record HolidayRequest(@NotNull LocalDate holidayDate,@NotBlank String holidayName) {}
