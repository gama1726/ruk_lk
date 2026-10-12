package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateAuditRepository extends JpaRepository<CertificateAuditEntity, UUID> {}
