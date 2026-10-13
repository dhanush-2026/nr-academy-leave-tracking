package com.zenbyte.leave.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.dto.LeaveActionRequest;
import com.zenbyte.leave.dto.LeaveCreateRequest;
import com.zenbyte.leave.entity.LeaveRequest;
import com.zenbyte.leave.entity.LeaveStatus;
import com.zenbyte.leave.service.AuthenticationService;
import com.zenbyte.leave.service.LeaveService;

import jakarta.validation.Valid;

@RestController
public class LeaveController {

    private final LeaveService s;
    private final AuthenticationService auth;

    public LeaveController(LeaveService s, AuthenticationService auth) {
        this.s = s;
        this.auth = auth;
    }

    @PostMapping("/api/user/leaves")
    @Transactional
    public Map<String, Object> create(
            @Valid @RequestBody LeaveCreateRequest r) {

        LeaveRequest l = s.create(
                auth.current().getEmployee().getId(),
                r
        );

        return map(l);
    }

    @GetMapping("/api/user/leaves")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> mine(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) {

        LocalDate f = from == null
                ? LocalDate.now().minusYears(1)
                : from;

        LocalDate t = to == null
                ? LocalDate.now().plusYears(1)
                : to;

        return s.my(
                auth.current().getEmployee().getId(),
                f,
                t
        )
        .stream()
        .map(this::map)
        .toList();
    }

    @GetMapping("/api/admin/leaves")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> admin(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            LeaveStatus status) {

        LocalDate f = from == null
                ? LocalDate.now().withDayOfMonth(1)
                : from;

        LocalDate t = to == null
                ? LocalDate.now()
                    .withDayOfMonth(1)
                    .plusMonths(1)
                    .minusDays(1)
                : to;

        return s.admin(f, t, search, status)
                .stream()
                .map(this::map)
                .toList();
    }

    @PutMapping("/api/admin/leaves/{id}/status")
    @Transactional
    public Map<String, Object> action(
            @PathVariable Long id,
            @Valid @RequestBody LeaveActionRequest r) {

        LeaveRequest l = s.action(id, r);

        return map(l);
    }

    @DeleteMapping("/api/admin/leaves/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        s.delete(id);
    }

    private Map<String, Object> map(LeaveRequest l) {

        Map<String, Object> m = new LinkedHashMap<>();

        m.put("id", l.getId());
        m.put("employeeId", l.getEmployee().getId());
        m.put("employeeCode", l.getEmployee().getEmployeeId());
        m.put("employeeName", l.getEmployee().getName());
        m.put("fromDate", l.getFromDate());
        m.put("toDate", l.getToDate());
        m.put("leaveDays", l.getLeaveDays());
        m.put("reason", l.getReason());
        m.put("description", l.getDescription());
        m.put("status", l.getStatus());
        m.put("appliedDate", l.getAppliedDate());
        m.put("actionDate", l.getActionDate());
        m.put("adminRemarks", l.getAdminRemarks());

        return m;
    }
}