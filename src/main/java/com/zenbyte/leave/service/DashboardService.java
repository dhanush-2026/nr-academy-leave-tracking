
package com.zenbyte.leave.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.zenbyte.leave.entity.Attendance;
import com.zenbyte.leave.entity.AttendanceStatus;
import com.zenbyte.leave.entity.Employee;
import com.zenbyte.leave.entity.LeaveRequest;
import com.zenbyte.leave.entity.LeaveStatus;
import com.zenbyte.leave.repository.AttendanceRepository;
import com.zenbyte.leave.repository.EmployeeRepository;
import com.zenbyte.leave.repository.HolidayRepository;
import com.zenbyte.leave.repository.LeaveRequestRepository;

@Service
public class DashboardService {

    private final EmployeeRepository er;
    private final AttendanceRepository ar;
    private final LeaveRequestRepository lr;
    private final HolidayRepository hr;
    private final LeaveService ls;

    public DashboardService(
            EmployeeRepository er,
            AttendanceRepository ar,
            LeaveRequestRepository lr,
            HolidayRepository hr,
            LeaveService ls) {

        this.er = er;
        this.ar = ar;
        this.lr = lr;
        this.hr = hr;
        this.ls = ls;
    }

    public Map<String, Object> admin() {

        LocalDate today = LocalDate.now();
        LocalDate first = today.withDayOfMonth(1);
        LocalDate last = first.plusMonths(1).minusDays(1);

        List<Employee> employees =
                er.findByActiveTrueOrderByNameAsc();

        long total = employees.size();

        LocalDate trendStart =
                YearMonth.from(today.minusMonths(5)).atDay(1);

        List<Attendance> attendanceRows =
                ar.findByAttendanceDateBetween(trendStart, last);

        List<LeaveRequest> leaveRows =
                lr.findOverlapping(trendStart, last);

        Set<LocalDate> holidayDates = new HashSet<>();

        hr.findByHolidayDateBetweenOrderByHolidayDateAsc(
                trendStart, last
        ).forEach(h -> holidayDates.add(h.getHolidayDate()));

        long absent = attendanceRows.stream()
                .filter(a -> a.getAttendanceDate().equals(today))
                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                .count();

        long present = Math.max(0, total - absent);

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("totalEmployees", total);
        result.put("todayAbsent", absent);
        result.put("todayPresent", present);

        int currentMonthLeaveDays = 0;

        for (Employee employee : employees) {
            currentMonthLeaveDays += countApplicableDays(
                    employee, first, last,
                    attendanceRows, leaveRows, holidayDates);
        }

        result.put("currentMonthLeaveDays", currentMonthLeaveDays);

        result.put("attendance", Map.of(
                "present", present,
                "absent", absent
        ));

        List<Map<String, Object>> trend = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {

            YearMonth month =
                    YearMonth.from(today.minusMonths(i));

            LocalDate from = month.atDay(1);
            LocalDate to = month.atEndOfMonth();

            int days = 0;

            for (Employee employee : employees) {
                days += countApplicableDays(
                        employee, from, to,
                        attendanceRows, leaveRows, holidayDates);
            }

            trend.add(Map.of(
                    "month", month.toString(),
                    "days", days
            ));
        }

        result.put("leaveTrend", trend);

        result.put("pendingRequests",
                lr.findOverlapping(
                        today.minusMonths(1),
                        today.plusMonths(1)
                ).stream()
                 .filter(l -> l.getStatus() == LeaveStatus.PENDING)
                 .count());

        result.put("upcomingHolidays",
                hr.findByHolidayDateBetweenOrderByHolidayDateAsc(
                        today, today.plusMonths(3)
                ).stream()
                 .limit(5)
                 .map(h -> Map.<String, Object>of(
                         "id", h.getId(),
                         "date", h.getHolidayDate(),
                         "name", h.getHolidayName()
                 ))
                 .toList());

        return result;
    }

    private int countApplicableDays(
            Employee employee,
            LocalDate from,
            LocalDate to,
            List<Attendance> attendanceRows,
            List<LeaveRequest> leaveRows,
            Set<LocalDate> holidayDates) {

        Set<LocalDate> dates = new HashSet<>();
        Long employeeId = employee.getId();

        for (Attendance attendance : attendanceRows) {

            if (!attendance.getEmployee().getId().equals(employeeId)) {
                continue;
            }

            LocalDate date = attendance.getAttendanceDate();

            if (attendance.getStatus() == AttendanceStatus.ABSENT
                    && !date.isBefore(from)
                    && !date.isAfter(to)
                    && isWorkingDay(date, holidayDates)) {
                dates.add(date);
            }
        }

        for (LeaveRequest leave : leaveRows) {

            if (!leave.getEmployee().getId().equals(employeeId)
                    || leave.getStatus() != LeaveStatus.APPROVED) {
                continue;
            }

            LocalDate start = leave.getFromDate().isAfter(from)
                    ? leave.getFromDate() : from;

            LocalDate end = leave.getToDate().isBefore(to)
                    ? leave.getToDate() : to;

            for (LocalDate date = start;
                    !date.isAfter(end);
                    date = date.plusDays(1)) {

                if (isWorkingDay(date, holidayDates)) {
                    dates.add(date);
                }
            }
        }

        return dates.size();
    }

    private boolean isWorkingDay(
            LocalDate date,
            Set<LocalDate> holidayDates) {

        return date.getDayOfWeek() != DayOfWeek.SUNDAY
                && !holidayDates.contains(date);
    }

    public Map<String, Object> user(Employee e) {

        LocalDate today = LocalDate.now();
        LocalDate first = today.withDayOfMonth(1);
        LocalDate last = first.plusMonths(1).minusDays(1);

        List<LeaveRequest> all = lr.findForEmployee(
                e.getId(),
                today.minusMonths(6),
                today.plusMonths(12)
        );

        long approved = all.stream()
                .filter(l -> l.getStatus() == LeaveStatus.APPROVED)
                .mapToInt(LeaveRequest::getLeaveDays)
                .sum();

        long pending = all.stream()
                .filter(l -> l.getStatus() == LeaveStatus.PENDING)
                .count();

        long rejected = all.stream()
                .filter(l -> l.getStatus() == LeaveStatus.REJECTED)
                .count();

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("employee", Map.of(
                "id", e.getId(),
                "employeeId", e.getEmployeeId(),
                "name", e.getName(),
                "department", Objects.toString(e.getDepartment(), "")
        ));

        result.put("approvedDays", approved);
        result.put("pendingRequests", pending);
        result.put("rejectedRequests", rejected);

        result.put("currentMonthLeaveDays",
                ls.applicableLeaveDaysForEmployee(
                        e.getId(), first, last));

        result.put("recentLeaves", all.stream()
                .limit(8)
                .map(l -> Map.of(
                        "id", l.getId(),
                        "fromDate", l.getFromDate(),
                        "toDate", l.getToDate(),
                        "leaveDays", l.getLeaveDays(),
                        "reason", l.getReason(),
                        "status", l.getStatus()
                ))
                .toList());

        List<Map<String, Object>> trend = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {

            YearMonth month =
                    YearMonth.from(today.minusMonths(i));

            trend.add(Map.of(
                    "month", month.toString(),
                    "days", ls.applicableLeaveDaysForEmployee(
                            e.getId(),
                            month.atDay(1),
                            month.atEndOfMonth())
            ));
        }

        result.put("leaveTrend", trend);

        return result;
    }
}