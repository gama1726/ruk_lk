package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LkAdminUserRepository extends JpaRepository<LkAdminUser, UUID> {

    Optional<LkAdminUser> findByUsernameIgnoreCase(String username);

    List<LkAdminUser> findAllByOrderByCreatedAtAsc();

    Optional<LkAdminUser> findFirstBySuperAdminTrue();
}
