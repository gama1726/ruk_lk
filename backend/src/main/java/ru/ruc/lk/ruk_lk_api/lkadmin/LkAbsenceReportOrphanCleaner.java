package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * После рестарта JVM асинхронный build отчёта не возобновляется.
 * Старые {@code RUNNING} помечаем {@code FAILED}, чтобы UI не крутил «зависший» прогресс.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 40)
public class LkAbsenceReportOrphanCleaner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportOrphanCleaner.class);
    private static final String INTERRUPTED_MESSAGE = "Прервано перезапуском сервера";

    private final LkAbsenceReportRepository reportRepository;

    public LkAbsenceReportOrphanCleaner(LkAbsenceReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<LkAbsenceReportEntity> orphans = reportRepository.findByStatus(LkAbsenceReportStatus.RUNNING);
        if (orphans.isEmpty()) {
            return;
        }
        Instant now = Instant.now();
        for (LkAbsenceReportEntity entity : orphans) {
            entity.setStatus(LkAbsenceReportStatus.FAILED);
            entity.setErrorMessage(INTERRUPTED_MESSAGE);
            entity.setProgressPhase("failed");
            entity.setProgressLabel(INTERRUPTED_MESSAGE);
            entity.setFinishedAt(now);
        }
        reportRepository.saveAll(orphans);
        log.warn("Помечено FAILED отчётов отсутствующих после рестарта: {}", orphans.size());
    }
}
