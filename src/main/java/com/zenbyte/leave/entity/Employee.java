package com.zenbyte.leave.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Entity @Table(name="employees", uniqueConstraints=@UniqueConstraint(name="uk_employee_code", columnNames="employee_id"))
public class Employee {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @NotBlank @Column(name="employee_id", nullable=false, unique=true) private String employeeId;
    @NotBlank @Column(nullable=false) private String name;
    private String department;
    @Email private String email;
    private String address;
    private String phone;
    private String additionalPhone;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
    private String bloodGroup;
    private boolean active=true;
    public Long getId(){return id;} public String getEmployeeId(){return employeeId;} public void setEmployeeId(String v){employeeId=v;}
    public String getName(){return name;} public void setName(String v){name=v;} public String getDepartment(){return department;} public void setDepartment(String v){department=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;} public String getAddress(){return address;} public void setAddress(String v){address=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;} public String getAdditionalPhone(){return additionalPhone;} public void setAdditionalPhone(String v){additionalPhone=v;}
    public LocalDate getDateOfBirth(){return dateOfBirth;} public void setDateOfBirth(LocalDate v){dateOfBirth=v;} public LocalDate getDateOfJoining(){return dateOfJoining;} public void setDateOfJoining(LocalDate v){dateOfJoining=v;}
    public String getBloodGroup(){return bloodGroup;} public void setBloodGroup(String v){bloodGroup=v;} public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
