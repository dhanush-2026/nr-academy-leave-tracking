package com.zenbyte.leave.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HolidayRequest(@NotNull
        LocalDate holidayDate, @NotBlank
        String holidayName) {}
