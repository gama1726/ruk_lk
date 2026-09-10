package ru.ruc.lk.ruk_lk_api.metrics;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboundServiceLoadStatsRepository extends JpaRepository<OutboundServiceLoadStats, String> {}
