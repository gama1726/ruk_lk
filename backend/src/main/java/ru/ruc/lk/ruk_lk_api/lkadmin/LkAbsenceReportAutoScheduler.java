package ru.ruc.lk.ruk_lk_api.lkadmin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Ежедневный автозапуск отчёта отсутствующих в 21:00 Europe/Moscow.
 * Включается {@code app.absence-report.auto-enabled=true}.
 */
@Component
@ConditionalOnProperty(name = "app.absence-report.auto-enabled", havingValue = "true")
public class LkAbsenceReportAutoScheduler {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportAutoScheduler.class);

    private final LkAbsenceReportService absenceReportService;

    public LkAbsenceReportAutoScheduler(LkAbsenceReportService absenceReportService) {
        this.absenceReportService = absenceReportService;
    }

    @Scheduled(cron = "${app.absence-report.auto-cron:0 0 21 * * *}", zone = "Europe/Moscow")
    public void runDaily() {
        try {
            absenceReportService.startAutoForToday().ifPresentOrElse(
                id -> log.info("Автоотчёт отсутствующих поставлен в очередь: {}", id),
                () -> log.info("Автоотчёт отсутствующих: запуск не требуется")
            );
        } catch (Exception e) {
            log.error("Автоотчёт отсутствующих не удалось запустить: {}", e.toString());
        }
    }
}
