package com.zenbyte.leave.service;

import com.zenbyte.leave.dto.EmployeeRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.entity.Employee;
import com.zenbyte.leave.entity.Role;
import com.zenbyte.leave.exception.ApiException;
import com.zenbyte.leave.repository.AppUserRepository;
import com.zenbyte.leave.repository.AttendanceRepository;
import com.zenbyte.leave.repository.EmployeeRepository;
import com.zenbyte.leave.repository.LeaveRequestRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository repo;
    private final AppUserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(
            EmployeeRepository repo,
            AppUserRepository userRepository,
            AttendanceRepository attendanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Employee> list(String search) {
        return search == null || search.isBlank()
                ? repo.findByActiveTrueOrderByNameAsc()
                : repo.findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCaseOrderByNameAsc(
                        search, search);
    }

    public Employee get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ApiException("Employee not found"));
    }

    @Transactional
    public Employee create(EmployeeRequest request) {
        if (repo.existsByEmployeeId(request.employeeId())) {
            throw new ApiException("Employee ID already exists");
        }

        if (request.password() == null || request.password().isBlank()) {
            throw new ApiException("Employee password is required");
        }

        // Employee ID is always the employee login username.
        if (userRepository.existsByUsername(request.employeeId())) {
            throw new ApiException("Employee login already exists");
        }

        Employee employee = new Employee();
        apply(employee, request);
        employee = repo.save(employee);

        AppUser user = new AppUser();
        user.setUsername(employee.getEmployeeId());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.EMPLOYEE);
        user.setEmployee(employee);
        user.setActive(employee.isActive());
        userRepository.save(user);

        return employee;
    }

    @Transactional
    public Employee update(Long id, EmployeeRequest request) {
        Employee employee = get(id);

        if (!employee.getEmployeeId().equals(request.employeeId())
                && repo.existsByEmployeeId(request.employeeId())) {
            throw new ApiException("Employee ID already exists");
        }

        String oldEmployeeId = employee.getEmployeeId();

        if (!oldEmployeeId.equals(request.employeeId())
                && userRepository.existsByUsername(request.employeeId())) {
            throw new ApiException("Employee login already exists");
        }

        apply(employee, request);
        employee = repo.save(employee);

        AppUser user = userRepository.findByEmployee(employee).orElse(null);

        if (user == null) {
            if (request.password() == null || request.password().isBlank()) {
                throw new ApiException("Employee login is missing. Set a password.");
            }

            user = new AppUser();
            user.setEmployee(employee);
            user.setRole(Role.EMPLOYEE);
        }

        // Always keep username equal to Employee ID.
        user.setUsername(employee.getEmployeeId());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        user.setRole(Role.EMPLOYEE);
        user.setEmployee(employee);
        user.setActive(employee.isActive());
        userRepository.save(user);

        return employee;
    }

    private void apply(Employee employee, EmployeeRequest request) {
        employee.setEmployeeId(request.employeeId());
        employee.setName(request.name());
        employee.setDepartment(request.department());
        employee.setEmail(request.email());
        employee.setAddress(request.address());
        employee.setPhone(request.phone());
        employee.setAdditionalPhone(request.additionalPhone());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setDateOfJoining(request.dateOfJoining());
        employee.setBloodGroup(request.bloodGroup());

        if (request.active() != null) {
            employee.setActive(request.active());
        }
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = get(id);

        // Delete dependent records first because attendance/leaves reference employee_id.
        leaveRequestRepository.deleteByEmployeeId(employee.getId());
        attendanceRepository.deleteByEmployeeId(employee.getId());

        // Delete the employee's login account.
        userRepository.findByEmployee(employee).ifPresent(user -> {
            userRepository.delete(user);
            userRepository.flush();
        });

        // Finally delete the employee itself.
        repo.delete(employee);
        repo.flush();
    }
}
