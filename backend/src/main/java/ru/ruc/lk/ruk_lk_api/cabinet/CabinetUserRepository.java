package ru.ruc.lk.ruk_lk_api.cabinet;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CabinetUserRepository extends JpaRepository<CabinetUser, String> {

    long countByLastSeenAtGreaterThanEqual(Instant since);

    long countByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(Instant from, Instant to);

    long countByCampus(CabinetCampus campus);

    long countByCampusIsNull();

    long countByCampusAndLastSeenAtGreaterThanEqual(CabinetCampus campus, Instant since);

    long countByCampusIsNullAndLastSeenAtGreaterThanEqual(Instant since);

    long countByCampusAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
        CabinetCampus campus,
        Instant from,
        Instant to
    );

    long countByCampusIsNullAndFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
        Instant from,
        Instant to
    );

    List<CabinetUser> findByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
        Instant from,
        Instant to
    );

    List<CabinetUser> findByCampusIsNull();

    @Query("""
        SELECT u FROM CabinetUser u
        WHERE (:campusUnknown = true AND u.campus IS NULL
            OR :campusUnknown = false AND (:campus IS NULL OR u.campus = :campus))
          AND (:role IS NULL OR u.role = :role)
          AND (
            :q IS NULL OR :q = ''
            OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :q, '%'))
          )
        """)
    Page<CabinetUser> search(
        @Param("campus") CabinetCampus campus,
        @Param("campusUnknown") boolean campusUnknown,
        @Param("role") CabinetUserRole role,
        @Param("q") String q,
        Pageable pageable
    );
}
