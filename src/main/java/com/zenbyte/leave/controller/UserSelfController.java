package com.zenbyte.leave.controller;

import java.time.LocalDate;
import java.util.Map; // Itha puthusa add panni irukkom

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping; // Itha puthusa add panni irukkom
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.dto.ChangePasswordRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.AuthenticationService;
import com.zenbyte.leave.service.EmployeeService;
import com.zenbyte.leave.service.LeaveCalculationService;
import com.zenbyte.leave.service.UserService;

@RestController 
@RequestMapping("/api/user") 
public class UserSelfController {
    
    private final AuthenticationService auth;
    private final EmployeeService es;
    private final LeaveCalculationService calc;
    private final UserService userService; // Puthusa UserService-a add panni irukkom

    public UserSelfController(AuthenticationService auth, EmployeeService es, LeaveCalculationService calc, UserService userService){
        this.auth = auth;
        this.es = es;
        this.calc = calc;
        this.userService = userService; // Inject pandrom
    } 

    @GetMapping("/profile") 
    public Object profile(){
        AppUser u = auth.current();
        return es.get(u.getEmployee().getId());
    } 

    @GetMapping("/leave-days") 
    public Map<String,Object> days(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to){
        return Map.of("days", calc.countWorkingDays(from,to));
    }

    // Puthu Password Change API Endpoint
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        // Current login aagi irukka user-oda details edukkurom
        AppUser currentUser = auth.current();
        
        // UserService vazhiya password update pandrom
        userService.changePassword(
            currentUser.getUsername(), 
            request.oldPassword(), 
            request.newPassword()
        );
        
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}