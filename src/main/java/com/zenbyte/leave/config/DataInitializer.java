package com.zenbyte.leave.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.zenbyte.leave.entity.AppUser;
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
                if (!userRepository.existsByUsername("admin")) {
                AppUser admin = new AppUser();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
            }

            
        };
    }
}
