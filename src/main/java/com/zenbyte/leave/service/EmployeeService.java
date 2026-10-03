package com.zenbyte.leave.service;
import com.zenbyte.leave.dto.EmployeeRequest; import com.zenbyte.leave.entity.Employee; import com.zenbyte.leave.exception.ApiException; import com.zenbyte.leave.repository.EmployeeRepository; import org.springframework.stereotype.Service; import java.util.*;
@Service public class EmployeeService {
 private final EmployeeRepository repo; public EmployeeService(EmployeeRepository repo){this.repo=repo;}
 public List<Employee> list(String search){return search==null||search.isBlank()?repo.findByActiveTrueOrderByNameAsc():repo.findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCaseOrderByNameAsc(search,search);}
 public Employee get(Long id){return repo.findById(id).orElseThrow(()->new ApiException("Employee not found"));}
 public Employee create(EmployeeRequest r){if(repo.existsByEmployeeId(r.employeeId()))throw new ApiException("Employee ID already exists"); Employee e=new Employee();apply(e,r);return repo.save(e);}
 public Employee update(Long id,EmployeeRequest r){Employee e=get(id);if(!e.getEmployeeId().equals(r.employeeId())&&repo.existsByEmployeeId(r.employeeId()))throw new ApiException("Employee ID already exists");apply(e,r);return repo.save(e);}
 private void apply(Employee e,EmployeeRequest r){e.setEmployeeId(r.employeeId());e.setName(r.name());e.setDepartment(r.department());e.setEmail(r.email());e.setAddress(r.address());e.setPhone(r.phone());e.setAdditionalPhone(r.additionalPhone());e.setDateOfBirth(r.dateOfBirth());e.setDateOfJoining(r.dateOfJoining());e.setBloodGroup(r.bloodGroup());if(r.active()!=null)e.setActive(r.active());}
 public void delete(Long id){Employee e=get(id);e.setActive(false);repo.save(e);}
}
