package com.zenbyte.leave.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.zenbyte.leave.dto.HolidayRequest;
import com.zenbyte.leave.entity.Holiday;
import com.zenbyte.leave.service.HolidayService;

import jakarta.validation.Valid;

@RestController
public class HolidayController {

    private final HolidayService s;

    public HolidayController(HolidayService s) {
        this.s = s;
    }

    @GetMapping({"/api/admin/holidays", "/api/user/holidays"})
    public List<Holiday> list() {
        return s.list();
    }

    @PostMapping("/api/admin/holidays")
    public Holiday create(@Valid @RequestBody HolidayRequest r) {
        return s.create(r);
    }

    @DeleteMapping("/api/admin/holidays/{id}")
    public void delete(@PathVariable Long id) {
        s.delete(id);
    }
}
