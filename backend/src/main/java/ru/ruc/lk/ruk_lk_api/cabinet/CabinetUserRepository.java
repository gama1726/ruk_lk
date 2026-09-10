package ru.ruc.lk.ruk_lk_api.cabinet;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CabinetUserRepository extends JpaRepository<CabinetUser, String> {

    long countByLastSeenAtGreaterThanEqual(Instant since);

    long countByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(Instant from, Instant to);

    List<CabinetUser> findByFirstLoginAtGreaterThanEqualAndFirstLoginAtLessThan(
        Instant from,
        Instant to
    );

    List<CabinetUser> findAllByOrderByFirstLoginAtDesc(Pageable pageable);
}
