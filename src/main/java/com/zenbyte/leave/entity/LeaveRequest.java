package com.zenbyte.leave.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="leaves")
public class LeaveRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false, fetch=FetchType.LAZY) @JoinColumn(name="employee_id") private Employee employee;
    @Column(nullable=false) private LocalDate fromDate;
    @Column(nullable=false) private LocalDate toDate;
    @Column(nullable=false) private int leaveDays;
    @Column(nullable=false) private String reason;
    @Column(length=2000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private LeaveStatus status=LeaveStatus.PENDING;
    @Column(nullable=false) private LocalDateTime appliedDate;
    private LocalDateTime actionDate;
    @Column(length=1000) private String adminRemarks;
    public Long getId(){return id;} public Employee getEmployee(){return employee;} public void setEmployee(Employee v){employee=v;} public LocalDate getFromDate(){return fromDate;} public void setFromDate(LocalDate v){fromDate=v;} public LocalDate getToDate(){return toDate;} public void setToDate(LocalDate v){toDate=v;} public int getLeaveDays(){return leaveDays;} public void setLeaveDays(int v){leaveDays=v;} public String getReason(){return reason;} public void setReason(String v){reason=v;} public String getDescription(){return description;} public void setDescription(String v){description=v;} public LeaveStatus getStatus(){return status;} public void setStatus(LeaveStatus v){status=v;} public LocalDateTime getAppliedDate(){return appliedDate;} public void setAppliedDate(LocalDateTime v){appliedDate=v;} public LocalDateTime getActionDate(){return actionDate;} public void setActionDate(LocalDateTime v){actionDate=v;} public String getAdminRemarks(){return adminRemarks;} public void setAdminRemarks(String v){adminRemarks=v;}
}
