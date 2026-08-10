package ru.ruc.lk.ruk_lk_api.admin;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

    Optional<AdminUser> findByUsernameIgnoreCase(String username);

    Optional<AdminUser> findByRole(EducationTrack role);

    boolean existsByRole(EducationTrack role);
}
