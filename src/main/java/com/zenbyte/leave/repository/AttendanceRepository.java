package com.zenbyte.leave.repository;
import com.zenbyte.leave.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.*;
public interface AttendanceRepository extends JpaRepository<Attendance,Long>{ Optional<Attendance> findByEmployeeIdAndAttendanceDate(Long employeeId,LocalDate date); List<Attendance> findByAttendanceDate(LocalDate date); List<Attendance> findByEmployeeIdAndAttendanceDateBetween(Long employeeId,LocalDate from,LocalDate to); }
