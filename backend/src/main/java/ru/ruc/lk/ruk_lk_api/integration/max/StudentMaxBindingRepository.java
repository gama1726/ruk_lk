package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentMaxBindingRepository extends JpaRepository<StudentMaxBinding, String> {
    Optional<StudentMaxBinding> findByMaxUserId(Long maxUserId);
}
