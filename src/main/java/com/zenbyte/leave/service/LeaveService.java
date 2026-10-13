
package com.zenbyte.leave.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zenbyte.leave.dto.LeaveActionRequest;
import com.zenbyte.leave.dto.LeaveCreateRequest;
import com.zenbyte.leave.entity.Attendance;
import com.zenbyte.leave.entity.AttendanceStatus;
import com.zenbyte.leave.entity.Employee;
import com.zenbyte.leave.entity.LeaveRequest;
import com.zenbyte.leave.entity.LeaveStatus;
import com.zenbyte.leave.exception.ApiException;
import com.zenbyte.leave.repository.AttendanceRepository;
import com.zenbyte.leave.repository.EmployeeRepository;
import com.zenbyte.leave.repository.LeaveRequestRepository;

@Service
public class LeaveService {

    private final LeaveRequestRepository lr;
    private final EmployeeRepository er;
    private final AttendanceRepository ar;
    private final LeaveCalculationService calc;

    public LeaveService(
            LeaveRequestRepository lr,
            EmployeeRepository er,
            AttendanceRepository ar,
            LeaveCalculationService calc) {
        this.lr = lr;
        this.er = er;
        this.ar = ar;
        this.calc = calc;
    }

    public LeaveRequest create(
            Long employeeId,
            LeaveCreateRequest r) {

        if (r.toDate().isBefore(r.fromDate())) {
            throw new ApiException(
                    "To date cannot be before from date");
        }

        Employee e = er.findById(employeeId)
                .orElseThrow(
                        () -> new ApiException("Employee not found"));

        LeaveRequest l = new LeaveRequest();

        l.setEmployee(e);
        l.setFromDate(r.fromDate());
        l.setToDate(r.toDate());
        l.setLeaveDays(
                calc.countWorkingDays(r.fromDate(), r.toDate()));
        l.setReason(r.reason());
        l.setDescription(r.description());
        l.setStatus(LeaveStatus.PENDING);
        l.setAppliedDate(LocalDateTime.now());

        return lr.save(l);
    }

    public List<LeaveRequest> my(
            Long employeeId,
            LocalDate from,
            LocalDate to) {

        return lr.findForEmployee(employeeId, from, to);
    }

    public List<LeaveRequest> admin(
            LocalDate from,
            LocalDate to,
            String search,
            LeaveStatus status) {

        return lr.findOverlapping(from, to)
                .stream()
                .filter(l ->
                        search == null
                        || search.isBlank()
                        || l.getEmployee().getName()
                                .toLowerCase()
                                .contains(search.toLowerCase())
                        || l.getEmployee().getEmployeeId()
                                .toLowerCase()
                                .contains(search.toLowerCase()))
                .filter(l ->
                        status == null || l.getStatus() == status)
                .toList();
    }

    @Transactional
    public LeaveRequest action(
            Long id,
            LeaveActionRequest r) {

        LeaveRequest l = lr.findById(id)
                .orElseThrow(
                        () -> new ApiException("Leave request not found"));

        if (r.status() == LeaveStatus.PENDING) {
            throw new ApiException(
                    "Action must be APPROVED or REJECTED");
        }

        // Already processed leave-ai duplicate-ah action panna avoid pannum
        if (l.getStatus() != LeaveStatus.PENDING) {
            throw new ApiException(
                    "This leave request has already been processed");
        }

        l.setStatus(r.status());
        l.setAdminRemarks(r.adminRemarks());
        l.setActionDate(LocalDateTime.now());

        LeaveRequest saved = lr.save(l);

        if (r.status() == LeaveStatus.APPROVED) {
            markApprovedLeaveAbsent(l);
        }

        return saved;
    }

    private void markApprovedLeaveAbsent(LeaveRequest l) {

        LocalDate date = l.getFromDate();
        LocalDate endDate = l.getToDate();

        while (!date.isAfter(endDate)) {

            // Sundays and holidays working date list-la irukkaadhu
            if (calc.workingDates(date, date).contains(date)) {

                Attendance a = ar
                        .findByEmployeeIdAndAttendanceDate(
                                l.getEmployee().getId(),
                                date)
                        .orElseGet(Attendance::new);

                a.setEmployee(l.getEmployee());
                a.setAttendanceDate(date);
                a.setStatus(AttendanceStatus.ABSENT);

                ar.save(a);
            }

            date = date.plusDays(1);
        }
    }

    public void delete(Long id) {

        if (!lr.existsById(id)) {
            throw new ApiException("Leave request not found");
        }

        lr.deleteById(id);
    }

    public int applicableLeaveDaysForEmployee(
            Long employeeId,
            LocalDate from,
            LocalDate to) {

        Set<LocalDate> dates = new HashSet<>();

        ar.findByEmployeeIdAndAttendanceDateBetween(
                employeeId, from, to)
                .stream()
                .filter(a ->
                        a.getStatus() == AttendanceStatus.ABSENT)
                .map(Attendance::getAttendanceDate)
                .forEach(dates::add);

        lr.findForEmployee(employeeId, from, to)
                .stream()
                .filter(l ->
                        l.getStatus() == LeaveStatus.APPROVED)
                .forEach(l ->
                        calc.workingDates(
                                max(from, l.getFromDate()),
                                min(to, l.getToDate()))
                                .forEach(dates::add));

        return (int) dates.stream()
                .filter(d ->
                        calc.workingDates(d, d).contains(d))
                .count();
    }

    public Map<Long, Integer> applicableDaysByEmployee(
            LocalDate from,
            LocalDate to) {

        return er.findByActiveTrueOrderByNameAsc()
                .stream()
                .collect(Collectors.toMap(
                        Employee::getId,
                        e -> applicableLeaveDaysForEmployee(
                                e.getId(), from, to),
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    private LocalDate max(LocalDate a, LocalDate b) {
        return a.isAfter(b) ? a : b;
    }

    private LocalDate min(LocalDate a, LocalDate b) {
        return a.isBefore(b) ? a : b;
    }
}
