package com.zenbyte.leave.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.zenbyte.leave.dto.UserRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.exception.ApiException;
import com.zenbyte.leave.repository.AppUserRepository;
import com.zenbyte.leave.repository.EmployeeRepository;

@Service
public class UserService {

    private final AppUserRepository repo;
    private final EmployeeRepository er;
    private final PasswordEncoder enc;

    public UserService(
            AppUserRepository repo,
            EmployeeRepository er,
            PasswordEncoder enc) {

        this.repo = repo;
        this.er = er;
        this.enc = enc;
    }

    public List<AppUser> list() {
        return repo.findAllByOrderByUsernameAsc();
    }

    public AppUser create(UserRequest r) {

        if (repo.existsByUsername(r.username())) {
            throw new ApiException("Username already exists");
        }

        AppUser u = new AppUser();

        u.setUsername(r.username());

        if (r.password() == null || r.password().isBlank()) {
            throw new ApiException("Password is required");
        }

        u.setPassword(enc.encode(r.password()));
        u.setRole(r.role());
        u.setActive(r.active() == null || r.active());

        if (r.employeeId() != null) {
            u.setEmployee(
                er.findById(r.employeeId())
                  .orElseThrow(() -> new ApiException("Employee not found"))
            );
        }

        return repo.save(u);
    }

    public AppUser update(Long id, UserRequest r) {

        AppUser u = repo.findById(id)
                .orElseThrow(() -> new ApiException("User not found"));

        if (!u.getUsername().equals(r.username())
                && repo.existsByUsername(r.username())) {

            throw new ApiException("Username already exists");
        }

        u.setUsername(r.username());
        u.setRole(r.role());

        if (r.password() != null && !r.password().isBlank()) {
            u.setPassword(enc.encode(r.password()));
        }

        u.setActive(r.active() == null || r.active());

        u.setEmployee(
            r.employeeId() == null
                ? null
                : er.findById(r.employeeId())
                    .orElseThrow(() -> new ApiException("Employee not found"))
        );

        return repo.save(u);
    }

    public void delete(Long id) {

        if (!repo.existsById(id)) {
            throw new ApiException("User not found");
        }

        repo.deleteById(id);
    }
    public void changePassword(String username, String oldPassword, String newPassword) {
        // 1. Username vachi user-a database la irunthu edukkurom
        AppUser u = repo.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found"));

        // 2. Old password correct ah irukka nu check pandrom
        if (!enc.matches(oldPassword, u.getPassword())) {
            throw new ApiException("Old password incorrect");
        }

        // 3. New password empty ah irukka kudadhu
        if (newPassword == null || newPassword.isBlank()) {
            throw new ApiException("New password cannot be empty");
        }

        // 4. Pudhu password-a encode panni save pandrom
        u.setPassword(enc.encode(newPassword));
        repo.save(u);
    }
}