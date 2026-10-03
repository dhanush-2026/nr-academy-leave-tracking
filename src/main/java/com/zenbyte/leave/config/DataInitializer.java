package com.zenbyte.leave.config;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.entity.Employee;
import com.zenbyte.leave.entity.Role;
import com.zenbyte.leave.repository.AppUserRepository;
import com.zenbyte.leave.repository.EmployeeRepository;
import com.zenbyte.leave.repository.HolidayRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seed(
            EmployeeRepository employeeRepository,
            AppUserRepository userRepository,
            HolidayRepository holidayRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            Employee employee = employeeRepository.findByEmployeeId("E001").orElseGet(() -> {
                Employee e = new Employee();
                e.setEmployeeId("E001");
                e.setName("Dhanush R");
                e.setDepartment("IT");
                e.setEmail("dhanush@nracademy.com");
                e.setPhone("9876543210");
                e.setDateOfJoining(LocalDate.of(2024, 1, 15));
                e.setBloodGroup("O+");
                return employeeRepository.save(e);
            });

            if (!userRepository.existsByUsername("admin")) {
                AppUser admin = new AppUser();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
            }

            if (!userRepository.existsByUsername("E001")) {
                AppUser user = new AppUser();
                user.setUsername("E001");
                user.setPassword(passwordEncoder.encode("User@123"));
                user.setRole(Role.EMPLOYEE);
                user.setEmployee(employee);
                user.setActive(true);
                userRepository.save(user);
            }
        };
    }
}
