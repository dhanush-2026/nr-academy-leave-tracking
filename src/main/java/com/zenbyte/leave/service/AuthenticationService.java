package com.zenbyte.leave.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.repository.AppUserRepository;

@Service
public class AuthenticationService {

    private final AppUserRepository repo;

    public AuthenticationService(AppUserRepository repo) {
        this.repo = repo;
    }

    public AppUser current() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        return repo.findByUsername(name).orElseThrow();
    }
}
