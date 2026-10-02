package com.zenbyte.leave.controller;

import com.zenbyte.leave.dto.UserRequest;
import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return service.list().stream()
                .map(this::map)
                .toList();
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody UserRequest request) {
        return map(service.create(request));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(
            @PathVariable Long id,
            @Valid @RequestBody UserRequest request) {
        return map(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private Map<String, Object> map(AppUser user) {
        Map<String, Object> output = new LinkedHashMap<>();
        output.put("id", user.getId());
        output.put("username", user.getUsername());
        output.put("role", user.getRole());
        output.put("active", user.isActive());
        output.put(
                "employeeId",
                user.getEmployee() == null
                        ? null
                        : user.getEmployee().getId()
        );
        output.put(
                "employeeCode",
                user.getEmployee() == null
                        ? null
                        : user.getEmployee().getEmployeeId()
        );
        return output;
    }
}
