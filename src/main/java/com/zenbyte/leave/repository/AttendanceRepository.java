
package com.zenbyte.leave.repository;

import com.zenbyte.leave.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(
            Long employeeId, LocalDate date);

    List<Attendance> findByAttendanceDate(LocalDate date);

    List<Attendance> findByEmployeeIdAndAttendanceDateBetween(
            Long employeeId, LocalDate from, LocalDate to);

    // Load attendance records for a complete date range
    List<Attendance> findByAttendanceDateBetween(
            LocalDate from, LocalDate to);
}