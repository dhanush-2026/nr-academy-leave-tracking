
package com.zenbyte.leave.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.dto.LoginRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.AuthenticationService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager am;
    private final AuthenticationService auth;

    private final SecurityContextRepository repo =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            AuthenticationManager am,
            AuthenticationService auth) {
        this.am = am;
        this.auth = auth;
    }

    @PostMapping("/login")
    public Map<String, Object> login(
            @Valid @RequestBody LoginRequest r,
            HttpServletRequest req,
            HttpServletResponse res) {

        Authentication a = am.authenticate(
                new UsernamePasswordAuthenticationToken(
                        r.username(),
                        r.password()
                )
        );

        SecurityContext c =
                SecurityContextHolder.createEmptyContext();

        c.setAuthentication(a);
        SecurityContextHolder.setContext(c);

        repo.saveContext(c, req, res);

        AppUser u = auth.current();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("role", u.getRole());
        out.put("username", u.getUsername());
        out.put(
                "employeeId",
                u.getEmployee() == null
                        ? null
                        : u.getEmployee().getEmployeeId()
        );

        return out;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("authenticated", false);

            return ResponseEntity.status(401).body(response);
        }

        AppUser u = auth.current();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("authenticated", true);
        out.put("role", u.getRole());
        out.put("username", u.getUsername());

        out.put(
                "employee",
                u.getEmployee() == null
                        ? null
                        : Map.of(
                                "id", u.getEmployee().getId(),
                                "employeeId",
                                u.getEmployee().getEmployeeId(),
                                "name", u.getEmployee().getName()
                        )
        );

        return ResponseEntity.ok(out);
    }
}