package com.zenbyte.leave.service;

// import com.zenbyte.leave.entity.Holiday;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.zenbyte.leave.repository.HolidayRepository;

@Service
public class LeaveCalculationService {

    private final HolidayRepository holidays;

    public LeaveCalculationService(HolidayRepository holidays) {
        this.holidays = holidays;
    }

    public Set<LocalDate> workingDates(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) {
            throw new IllegalArgumentException("Invalid date range");
        }

        Set<LocalDate> holidaySet = new HashSet<>();

        holidays.findByHolidayDateBetweenOrderByHolidayDateAsc(from, to)
                .forEach(h -> holidaySet.add(h.getHolidayDate()));

        Set<LocalDate> out = new LinkedHashSet<>();

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (d.getDayOfWeek() != DayOfWeek.SUNDAY && !holidaySet.contains(d)) {
                out.add(d);
            }
        }

        return out;
    }

    public int countWorkingDays(LocalDate from, LocalDate to) {
        return workingDates(from, to).size();
    }
}