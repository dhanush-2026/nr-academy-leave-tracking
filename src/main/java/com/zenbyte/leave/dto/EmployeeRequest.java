package com.zenbyte.leave.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmployeeRequest(@NotBlank
        String employeeId, @NotBlank
        String name, String department, @Email
        String email, String address, String phone, String additionalPhone, LocalDate dateOfBirth, LocalDate dateOfJoining, String bloodGroup, Boolean active) {}
