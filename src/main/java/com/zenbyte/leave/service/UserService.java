package com.zenbyte.leave.service;

import com.zenbyte.leave.dto.UserRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.entity.Role;
import com.zenbyte.leave.exception.ApiException;
import com.zenbyte.leave.repository.AppUserRepository;
import com.zenbyte.leave.repository.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final AppUserRepository repo;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            AppUserRepository repo,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AppUser> list() {
        return repo.findAllByOrderByUsernameAsc();
    }

    public AppUser create(UserRequest request) {
        if (request.role() == Role.EMPLOYEE) {
            if (request.employeeId() == null) {
                throw new ApiException("Employee must be linked to an employee record");
            }

            var employee = employeeRepository.findById(request.employeeId())
                    .orElseThrow(() -> new ApiException("Employee not found"));

            // Employee ID is the only valid employee username.
            String username = employee.getEmployeeId();

            if (repo.existsByUsername(username)) {
                throw new ApiException("Employee login already exists for " + username);
            }

            if (request.password() == null || request.password().isBlank()) {
                throw new ApiException("Password is required");
            }

            AppUser user = new AppUser();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setRole(Role.EMPLOYEE);
            user.setActive(request.active() == null || request.active());
            user.setEmployee(employee);
            return repo.save(user);
        }

        if (repo.existsByUsername(request.username())) {
            throw new ApiException("Username already exists");
        }

        if (request.password() == null || request.password().isBlank()) {
            throw new ApiException("Password is required");
        }

        AppUser user = new AppUser();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.ADMIN);
        user.setActive(request.active() == null || request.active());
        user.setEmployee(null);

        return repo.save(user);
    }

    public AppUser update(Long id, UserRequest request) {
        AppUser user = repo.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));

        if (request.role() == Role.EMPLOYEE) {
            if (request.employeeId() == null) {
                throw new ApiException("Employee must be linked to an employee record");
            }

            var employee = employeeRepository.findById(request.employeeId())
                    .orElseThrow(() -> new ApiException("Employee not found"));

            String username = employee.getEmployeeId();

            if (!user.getUsername().equals(username) && repo.existsByUsername(username)) {
                throw new ApiException("Employee login already exists for " + username);
            }

            user.setUsername(username);
            user.setRole(Role.EMPLOYEE);
            user.setEmployee(employee);

            if (request.password() != null && !request.password().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.password()));
            }

            user.setActive(request.active() == null || request.active());
            return repo.save(user);
        }

        // Admin users are never linked to an employee.
        String username = request.username();

        if (!user.getUsername().equals(username) && repo.existsByUsername(username)) {
            throw new ApiException("Username already exists");
        }

        user.setUsername(username);
        user.setRole(Role.ADMIN);
        user.setEmployee(null);

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        user.setActive(request.active() == null || request.active());
        return repo.save(user);
    }

    public void delete(Long id) {
        AppUser user = repo.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));

        if (user.getRole() == Role.EMPLOYEE && user.getEmployee() != null) {
            throw new ApiException(
                    "Delete the employee from Employee Management so all employee data is removed together"
            );
        }

        repo.delete(user);
    }
}
