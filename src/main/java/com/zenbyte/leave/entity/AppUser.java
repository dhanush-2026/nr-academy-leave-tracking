package com.zenbyte.leave.entity;

import jakarta.persistence.*;

@Entity @Table(name="users", uniqueConstraints=@UniqueConstraint(name="uk_username", columnNames="username"))
public class AppUser {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private String username;
    @Column(nullable=false) private String password;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="employee_id") private Employee employee;
    @Column(nullable=false) private boolean active=true;
    public Long getId(){return id;} public String getUsername(){return username;} public void setUsername(String v){username=v;} public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public Role getRole(){return role;} public void setRole(Role v){role=v;} public Employee getEmployee(){return employee;} public void setEmployee(Employee v){employee=v;} public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
}
