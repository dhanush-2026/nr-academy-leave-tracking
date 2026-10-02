package com.zenbyte.leave.controller;

import com.zenbyte.leave.dto.LoginRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AuthenticationService authenticationService;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            AuthenticationManager authenticationManager,
            AuthenticationService authenticationService) {
        this.authenticationManager = authenticationManager;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUser user = authenticationService.current();

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("role", user.getRole());
        output.put("username", user.getUsername());
        output.put(
                "employeeId",
                user.getEmployee() == null
                        ? null
                        : user.getEmployee().getEmployeeId()
        );

        return output;
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        AppUser user = authenticationService.current();

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("authenticated", true);
        output.put("role", user.getRole());
        output.put("username", user.getUsername());
        output.put(
                "employee",
                user.getEmployee() == null
                        ? null
                        : Map.of(
                                "id", user.getEmployee().getId(),
                                "employeeId", user.getEmployee().getEmployeeId(),
                                "name", user.getEmployee().getName()
                        )
        );

        return output;
    }
}
