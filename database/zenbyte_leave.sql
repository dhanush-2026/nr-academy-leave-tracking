CREATE DATABASE IF NOT EXISTS zenbyte_leave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zenbyte_leave;

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255), email VARCHAR(255), address VARCHAR(1000), phone VARCHAR(100), additional_phone VARCHAR(100),
  date_of_birth DATE, date_of_joining DATE, blood_group VARCHAR(20), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  employee_id BIGINT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_users_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  CONSTRAINT uk_attendance_employee_date UNIQUE(employee_id,attendance_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS leaves (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  leave_days INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description VARCHAR(2000),
  status VARCHAR(20) NOT NULL,
  applied_date DATETIME NOT NULL,
  action_date DATETIME NULL,
  admin_remarks VARCHAR(1000),
  CONSTRAINT fk_leaves_employee FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS holidays (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name VARCHAR(255) NOT NULL
);

-- Demo users are seeded automatically by Spring Boot on first startup:
-- ADMIN: admin / Admin@123
-- USER : E001 / User@123
