package com.zenbyte.leave.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity @Table(name="attendance", uniqueConstraints=@UniqueConstraint(name="uk_attendance_employee_date", columnNames={"employee_id","attendance_date"}))
public class Attendance {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) @JoinColumn(name="employee_id") private Employee employee;
    @Column(name="attendance_date", nullable=false) private LocalDate attendanceDate;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private AttendanceStatus status;
    public Long getId(){return id;} public Employee getEmployee(){return employee;} public void setEmployee(Employee v){employee=v;} public LocalDate getAttendanceDate(){return attendanceDate;} public void setAttendanceDate(LocalDate v){attendanceDate=v;} public AttendanceStatus getStatus(){return status;} public void setStatus(AttendanceStatus v){status=v;}
}
