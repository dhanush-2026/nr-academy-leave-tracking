package com.zenbyte.leave.service;

import com.zenbyte.leave.dto.*; import com.zenbyte.leave.entity.*; import com.zenbyte.leave.exception.ApiException; import com.zenbyte.leave.repository.*; import org.springframework.stereotype.Service;
import java.time.*; import java.util.*; import java.util.stream.*;

@Service public class LeaveService {
 private final LeaveRequestRepository lr; private final EmployeeRepository er; private final AttendanceRepository ar; private final LeaveCalculationService calc;
 public LeaveService(LeaveRequestRepository lr,EmployeeRepository er,AttendanceRepository ar,LeaveCalculationService calc){this.lr=lr;this.er=er;this.ar=ar;this.calc=calc;}
 public LeaveRequest create(Long employeeId,LeaveCreateRequest r){if(r.toDate().isBefore(r.fromDate()))throw new ApiException("To date cannot be before from date");Employee e=er.findById(employeeId).orElseThrow(()->new ApiException("Employee not found"));LeaveRequest l=new LeaveRequest();l.setEmployee(e);l.setFromDate(r.fromDate());l.setToDate(r.toDate());l.setLeaveDays(calc.countWorkingDays(r.fromDate(),r.toDate()));l.setReason(r.reason());l.setDescription(r.description());l.setStatus(LeaveStatus.PENDING);l.setAppliedDate(LocalDateTime.now());return lr.save(l);}
 public List<LeaveRequest> my(Long employeeId,LocalDate from,LocalDate to){return lr.findForEmployee(employeeId,from,to);}
 public List<LeaveRequest> admin(LocalDate from,LocalDate to,String search,LeaveStatus status){return lr.findOverlapping(from,to).stream().filter(l->search==null||search.isBlank()||l.getEmployee().getName().toLowerCase().contains(search.toLowerCase())||l.getEmployee().getEmployeeId().toLowerCase().contains(search.toLowerCase())).filter(l->status==null||l.getStatus()==status).toList();}
 public LeaveRequest action(Long id,LeaveActionRequest r){LeaveRequest l=lr.findById(id).orElseThrow(()->new ApiException("Leave request not found"));if(r.status()==LeaveStatus.PENDING)throw new ApiException("Action must be APPROVED or REJECTED");l.setStatus(r.status());l.setAdminRemarks(r.adminRemarks());l.setActionDate(LocalDateTime.now());return lr.save(l);}
 public void delete(Long id){if(!lr.existsById(id))throw new ApiException("Leave request not found");lr.deleteById(id);}
 public int applicableLeaveDaysForEmployee(Long employeeId,LocalDate from,LocalDate to){Set<LocalDate> dates=new HashSet<>(); ar.findByEmployeeIdAndAttendanceDateBetween(employeeId,from,to).stream().filter(a->a.getStatus()==AttendanceStatus.ABSENT).map(Attendance::getAttendanceDate).forEach(d->dates.add(d)); lr.findForEmployee(employeeId,from,to).stream().filter(l->l.getStatus()==LeaveStatus.APPROVED).forEach(l->calc.workingDates(max(from,l.getFromDate()),min(to,l.getToDate())).forEach(dates::add)); return (int)dates.stream().filter(d->calc.workingDates(d,d).contains(d)).count(); }
 public Map<Long,Integer> applicableDaysByEmployee(LocalDate from,LocalDate to){return er.findByActiveTrueOrderByNameAsc().stream().collect(Collectors.toMap(Employee::getId,e->applicableLeaveDaysForEmployee(e.getId(),from,to), (a,b)->a,LinkedHashMap::new));}
 private LocalDate max(LocalDate a,LocalDate b){return a.isAfter(b)?a:b;} private LocalDate min(LocalDate a,LocalDate b){return a.isBefore(b)?a:b;}
}
