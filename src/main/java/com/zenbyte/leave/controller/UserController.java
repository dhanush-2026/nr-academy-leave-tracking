package com.zenbyte.leave.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.dto.UserRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserService s;

    public UserController(UserService s) {
        this.s = s;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return s.list().stream().map(this::map).toList();
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody UserRequest r) {
        return map(s.create(r));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @Valid @RequestBody UserRequest r) {
        return map(s.update(id, r));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        s.delete(id);
    }

    private Map<String, Object> map(AppUser u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("username", u.getUsername());
        m.put("role", u.getRole());
        m.put("active", u.isActive());
        m.put("employeeId", u.getEmployee() == null ? null : u.getEmployee().getId());
        m.put("employeeCode", u.getEmployee() == null ? null : u.getEmployee().getEmployeeId());
        return m;
    }
}
