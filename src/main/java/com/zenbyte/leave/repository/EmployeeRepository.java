package com.zenbyte.leave.repository;
import com.zenbyte.leave.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface EmployeeRepository extends JpaRepository<Employee,Long>{ Optional<Employee> findByEmployeeId(String employeeId); boolean existsByEmployeeId(String employeeId); List<Employee> findByActiveTrueOrderByNameAsc(); List<Employee> findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCaseOrderByNameAsc(String name,String id); }
