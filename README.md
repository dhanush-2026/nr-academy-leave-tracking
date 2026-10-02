# Zenbyte – NR ACADEMY Office Leave Tracking System

A complete Spring Boot + Spring Security + JPA/Hibernate + MySQL + HTML/CSS/JavaScript office leave tracking application with separate Admin and Employee interfaces.

## Technology
- Java 21
- Spring Boot 3.5.6
- Spring Web / REST
- Spring Data JPA / Hibernate
- Spring Security (session authentication + BCrypt)
- MySQL 8+
- HTML5 / CSS3 / Vanilla JavaScript
- Eclipse IDE / Maven

## Features
### Admin
Dashboard, employee CRUD, search/filter, attendance by date, Present-by-default attendance, leave tracking with This Month/3 Months/1 Year/Custom ranges, leave request approval/rejection/deletion, government holiday CRUD with duplicate-date prevention, user management, reports, responsive UI, live database statistics.

### Employee
Personal dashboard, leave application, server-side leave-day calculation, personal leave history/status, government holiday list, personal profile, responsive mobile UI.

## Mandatory leave rules implemented
1. Sunday does not count.
2. Government holidays do not count.
3. Saturday counts unless it is a government holiday.
4. Pending leave does not contribute to approved/applicable leave statistics.
5. Rejected leave does not contribute.
6. Approved leave contributes.
7. Recorded ABSENT days contribute.
8. If ABSENT and APPROVED leave overlap on the same applicable date, the date is counted once.
9. The reusable `LeaveCalculationService` is used as the central working-day calculation service; employee leave statistics additionally merge attendance absences and approved leave through the same working-day rules.

## 1. Install prerequisites
- JDK 21
- MySQL 8.x
- Maven 3.9+
- Eclipse IDE with Spring/Maven support (Spring Tools is recommended)

## 2. Create the database
Option A: Run `database/zenbyte_leave.sql` in MySQL Workbench.

Option B:
```sql
CREATE DATABASE zenbyte_leave CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The application uses `spring.jpa.hibernate.ddl-auto=update`, so JPA creates/updates the tables.

## 3. Configure MySQL
Default configuration:
- URL: `jdbc:mysql://localhost:3306/zenbyte_leave?...`
- username: `root`
- password: `root`

Change them in `src/main/resources/application.properties`, or set environment variables:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

Example:
```text
DB_URL=jdbc:mysql://localhost:3306/zenbyte_leave?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
DB_USERNAME=root
DB_PASSWORD=YourPassword
```

## 4. Open in Eclipse

**Important:** import this as a **Maven project**, not as a plain Java project. The project includes Eclipse `.project`, `.classpath`, and `.settings` metadata.

1. Extract the ZIP.
2. Eclipse → **File → Import → Maven → Existing Maven Projects**.
3. Select the extracted `zenbyte-leave-tracking` folder.
4. Finish and wait for Maven dependencies to download.
5. Right-click the project → **Maven → Update Project** → enable **Force Update of Snapshots/Releases** → Apply.
6. Project → **Clean**.
7. Open `src/main/java/com/zenbyte/leave/ZenbyteLeaveApplication.java`.
8. Run As → **Spring Boot App** (or Java Application).

If Eclipse still shows errors such as `package com.zenbyte.leave.entity does not exist`, remove the project from the Eclipse workspace **without deleting files from disk**, then repeat steps 2–6. This forces Eclipse/m2e to rebuild the Maven classpath.

## 5. Run with Maven
From the project root:
```bash
mvn clean spring-boot:run
```

Or build:
```bash
mvn clean package
java -jar target/zenbyte-leave-tracking-1.0.0.jar
```

## 6. Open the application
Open:
`http://localhost:8080/`

The application serves the frontend from the same Spring Boot server, so no separate frontend server or CORS configuration is required.

## Demo login
### Admin
- Username: `admin`
- Password: `Admin@123`

### Employee
- Username: `E001`
- Password: `User@123`

The demo accounts are created automatically if they do not already exist. Change/delete these credentials for a real deployment.

## REST API overview
### Authentication
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Admin
- `GET/POST /api/admin/employees`
- `GET/PUT/DELETE /api/admin/employees/{id}`
- `GET/PUT /api/admin/attendance?date=YYYY-MM-DD`
- `POST /api/admin/attendance/mark-all-present?date=YYYY-MM-DD`
- `GET /api/admin/leaves`
- `PUT /api/admin/leaves/{id}/status`
- `DELETE /api/admin/leaves/{id}`
- `GET/POST /api/admin/holidays`
- `DELETE /api/admin/holidays/{id}`
- `GET/POST /api/admin/users`
- `PUT/DELETE /api/admin/users/{id}`
- `GET /api/admin/dashboard`
- `GET /api/admin/reports/leave-summary?from=...&to=...&search=...`

### Employee
- `GET /api/user/dashboard`
- `GET/POST /api/user/leaves`
- `GET /api/user/leave-days?from=...&to=...`
- `GET /api/user/holidays`
- `GET /api/user/profile`

## Security
- BCrypt password hashing.
- Session-based Spring Security authentication.
- Admin APIs require `ROLE_ADMIN`.
- Employee APIs require `ROLE_EMPLOYEE` (Admin is also allowed by the security rule for shared read routes).
- Employee leave endpoints always use the authenticated user's linked employee ID; a normal employee cannot request another employee's leave records through the API.
- Logout invalidates the session.

## Important production notes
This project is designed as a complete runnable office application baseline. Before production deployment, change demo credentials, use a strong MySQL account, enable HTTPS, review CSRF strategy for your deployment architecture, add database backups, and put the application behind your normal corporate authentication/network controls if required.

## Verification performed before packaging
- Verified all required project files and frontend references exist.
- Ran JavaScript syntax checks with Node.js for all frontend scripts.
- Ran Java source structural/brace checks.
- Inspected the REST route wiring against the frontend API calls.
- A full Maven compile/test could not be executed in the build environment used to create this ZIP because Maven and external dependency download access were unavailable. The project is configured as a standard Maven Spring Boot project and Eclipse/Maven will resolve dependencies when imported on a machine with Maven/network access.
