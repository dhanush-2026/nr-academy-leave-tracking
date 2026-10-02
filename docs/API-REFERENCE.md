# API Reference

All API payloads are JSON unless otherwise stated. Authentication uses the HTTP session cookie created by `/api/auth/login`.

## Login
`POST /api/auth/login`
```json
{"username":"admin","password":"Admin@123"}
```

## Employee create
`POST /api/admin/employees`
```json
{"employeeId":"E002","name":"Priya S","department":"HR","email":"priya@example.com","address":"Coimbatore","phone":"9000000000","additionalPhone":"","dateOfBirth":"1998-05-10","dateOfJoining":"2026-01-05","bloodGroup":"B+","active":true}
```

## Leave application
`POST /api/user/leaves`
```json
{"fromDate":"2026-10-05","toDate":"2026-10-08","reason":"Personal Leave","description":"Optional details"}
```

## Leave action
`PUT /api/admin/leaves/{id}/status`
```json
{"status":"APPROVED","adminRemarks":"Approved."}
```

## Attendance save
`PUT /api/admin/attendance?date=2026-10-02`
```json
[{"employeeId":1,"status":"PRESENT"},{"employeeId":2,"status":"ABSENT"}]
```
