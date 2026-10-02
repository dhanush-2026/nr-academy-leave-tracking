package com.zenbyte.leave.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank String employeeId,
        @NotBlank String name,
        String department,
        @Email String email,
        String address,
        String phone,
        String additionalPhone,
        LocalDate dateOfBirth,
        LocalDate dateOfJoining,
        String bloodGroup,
        Boolean active,
        String password
) {
}
