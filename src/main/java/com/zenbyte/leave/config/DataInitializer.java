package com.zenbyte.leave.config;

import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.entity.Role;
import com.zenbyte.leave.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seed(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            // Only seed the Admin account if it does not already exist.
            // Employee accounts must be created by Admin from Employee Management.
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
