package com.zenbyte.leave.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zenbyte.leave.entity.Holiday;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    boolean existsByHolidayDate(LocalDate date);

    Optional<Holiday> findByHolidayDate(LocalDate date);

    List<Holiday> findAllByOrderByHolidayDateAsc();

    List<Holiday> findByHolidayDateBetweenOrderByHolidayDateAsc(LocalDate from, LocalDate to);
}
