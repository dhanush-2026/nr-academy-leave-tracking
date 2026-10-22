package com.zenbyte.leave.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "holidays", uniqueConstraints = @UniqueConstraint(name = "uk_holiday_date", columnNames = "holiday_date"))
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "holiday_date", nullable = false, unique = true)
    private LocalDate holidayDate;
    @Column(nullable = false)
    private String holidayName;

    public Long getId() {
        return id;
    }

    public LocalDate getHolidayDate() {
        return holidayDate;
    }

    public void setHolidayDate(LocalDate v) {
        holidayDate = v;
    }

    public String getHolidayName() {
        return holidayName;
    }

    public void setHolidayName(String v) {
        holidayName = v;
    }
}
