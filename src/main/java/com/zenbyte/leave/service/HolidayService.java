package com.zenbyte.leave.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.zenbyte.leave.dto.HolidayRequest;
import com.zenbyte.leave.entity.Holiday;
import com.zenbyte.leave.exception.ApiException;
import com.zenbyte.leave.repository.HolidayRepository;

@Service
public class HolidayService {

    private final HolidayRepository repo;

    public HolidayService(HolidayRepository repo) {
        this.repo = repo;
    }

    public List<Holiday> list() {
        return repo.findAllByOrderByHolidayDateAsc();
    }

    public Holiday create(HolidayRequest r) {
        if (repo.existsByHolidayDate(r.holidayDate())) {
            throw new ApiException("Holiday already exists for this date");
        
        }Holiday h = new Holiday();
        h.setHolidayDate(r.holidayDate());
        h.setHolidayName(r.holidayName());
        return repo.save(h);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ApiException("Holiday not found");
        
        }repo.deleteById(id);
    }
}
