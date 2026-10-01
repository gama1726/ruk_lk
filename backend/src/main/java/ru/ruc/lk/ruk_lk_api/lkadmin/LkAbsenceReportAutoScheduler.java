package ru.ruc.lk.ruk_lk_api.lkadmin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Ежедневный автозапуск отчётов отсутствующих (21:00 Europe/Moscow по умолчанию).
 * Кампусы с эффективным auto (флаг AND админка) ставятся в очередь по отдельности.
 */
@Component
public class LkAbsenceReportAutoScheduler {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportAutoScheduler.class);

    private final LkAbsenceReportService absenceReportService;

    public LkAbsenceReportAutoScheduler(LkAbsenceReportService absenceReportService) {
        this.absenceReportService = absenceReportService;
    }

    @Scheduled(cron = "${app.absence-report.auto-cron:0 0 21 * * *}", zone = "Europe/Moscow")
    public void runDaily() {
        try {
            var ids = absenceReportService.startAutoForTodayAll();
            if (ids.isEmpty()) {
                log.info("Автоотчёт отсутствующих: запусков нет");
            } else {
                log.info("Автоотчёт отсутствующих: поставлено в очередь {} шт.: {}", ids.size(), ids);
            }
        } catch (Exception e) {
            log.error("Автоотчёт отсутствующих не удалось запустить: {}", e.toString());
        }
    }
}
