package com.zenbyte.leave.repository;
import com.zenbyte.leave.entity.Holiday; import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.*;
public interface HolidayRepository extends JpaRepository<Holiday,Long>{ boolean existsByHolidayDate(LocalDate date); Optional<Holiday> findByHolidayDate(LocalDate date); List<Holiday> findAllByOrderByHolidayDateAsc(); List<Holiday> findByHolidayDateBetweenOrderByHolidayDateAsc(LocalDate from,LocalDate to); }
