package com.zenbyte.leave;

import com.zenbyte.leave.repository.HolidayRepository;
import com.zenbyte.leave.service.LeaveCalculationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaveCalculationServiceTest {
    @Mock HolidayRepository holidayRepository;

    @Test void excludesSundayAndIncludesSaturday() {
        when(holidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(any(), any())).thenReturn(List.of());
        var service = new LeaveCalculationService(holidayRepository);
        // Friday + Saturday + Monday = 3; Sunday excluded.
        assertEquals(3, service.countWorkingDays(LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 5)));
    }

    @Test void excludesGovernmentHoliday() {
        var holiday = new com.zenbyte.leave.entity.Holiday();
        holiday.setHolidayDate(LocalDate.of(2026, 10, 2));
        holiday.setHolidayName("Test Holiday");
        when(holidayRepository.findByHolidayDateBetweenOrderByHolidayDateAsc(any(), any())).thenReturn(List.of(holiday));
        var service = new LeaveCalculationService(holidayRepository);
        assertEquals(1, service.countWorkingDays(LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 3)));
    }

    private static <T> T any(){ return org.mockito.ArgumentMatchers.any(); }
}
