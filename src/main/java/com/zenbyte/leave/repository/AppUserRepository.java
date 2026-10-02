package com.zenbyte.leave.repository;

import com.zenbyte.leave.entity.AppUser;
import com.zenbyte.leave.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<AppUser> findByEmployee(Employee employee);

    List<AppUser> findAllByOrderByUsernameAsc();

    @Transactional
    @Modifying
    @Query(value = "UPDATE users SET role = 'EMPLOYEE' WHERE role = 'USER'", nativeQuery = true)
    int migrateLegacyUserRole();
}
