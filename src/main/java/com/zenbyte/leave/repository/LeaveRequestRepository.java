package com.zenbyte.leave.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.zenbyte.leave.entity.LeaveRequest;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    @Query("""
        select l
        from LeaveRequest l
        join fetch l.employee e
        where l.toDate >= :from
          and l.fromDate <= :to
        order by
          case l.status
              when com.zenbyte.leave.entity.LeaveStatus.PENDING then 0
              else 1
          end,
          l.appliedDate desc
    """)
    List<LeaveRequest> findOverlapping(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        select l
        from LeaveRequest l
        join fetch l.employee e
        where e.id = :employeeId
          and l.toDate >= :from
          and l.fromDate <= :to
        order by l.appliedDate desc
    """)
    List<LeaveRequest> findForEmployee(
            @Param("employeeId") Long employeeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        select l
        from LeaveRequest l
        join fetch l.employee e
        where l.id = :id
    """)
    java.util.Optional<LeaveRequest> findByIdWithEmployee(
            @Param("id") Long id
    );
}