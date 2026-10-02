package com.zenbyte.leave.controller;

import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.AuthenticationService;
import com.zenbyte.leave.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthenticationService authenticationService;

    public DashboardController(
            DashboardService dashboardService,
            AuthenticationService authenticationService) {
        this.dashboardService = dashboardService;
        this.authenticationService = authenticationService;
    }

    @GetMapping("/admin/dashboard")
    public Map<String, Object> admin() {
        return dashboardService.admin();
    }

    @GetMapping("/user/dashboard")
    public Map<String, Object> user() {
        AppUser user = authenticationService.current();
        if (user.getEmployee() == null) {
            throw new IllegalStateException("This user is not linked to an employee");
        }
        return dashboardService.user(user.getEmployee());
    }
}
