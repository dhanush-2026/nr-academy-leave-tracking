package com.zenbyte.leave.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.entity.Employee;
import com.zenbyte.leave.service.EmployeeService;
import com.zenbyte.leave.service.LeaveService;

@RestController
@RequestMapping("/api/admin/reports")
public class ReportController {

    private final EmployeeService es;
    private final LeaveService ls;

    public ReportController(EmployeeService es, LeaveService ls) {
        this.es = es;
        this.ls = ls;
    }

    @GetMapping("/leave-summary")
    public List<Map<String, Object>> summary(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to, @RequestParam(required = false) String search) {
        List<Employee> em = es.list(search);
        Map<Long, Integer> counts = ls.applicableDaysByEmployee(from, to);
        return em.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("employeeId", e.getEmployeeId());
            m.put("name", e.getName());
            m.put("department", e.getDepartment());
            m.put("leaveDays", counts.getOrDefault(e.getId(), 0));
            return m;
        }).toList();
    }
}
