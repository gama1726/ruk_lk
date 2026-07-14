package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaxBindTokenRepository extends JpaRepository<MaxBindToken, String> {
    List<MaxBindToken> findByStudentId(String studentId);

    void deleteByStudentId(String studentId);
}
