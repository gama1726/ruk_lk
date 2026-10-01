package ru.ruc.lk.ruk_lk_api.cabinet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Обход уже зашедших пользователей ЛК без кампуса — проставляет филиал из 1С.
 * В фоне, чтобы не блокировать старт приложения.
 */
@Component
@Order(200)
public class CabinetCampusBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CabinetCampusBackfill.class);

    private final CabinetUserService cabinetUserService;

    public CabinetCampusBackfill(CabinetUserService cabinetUserService) {
        this.cabinetUserService = cabinetUserService;
    }

    @Override
    public void run(ApplicationArguments args) {
        Thread t = new Thread(() -> {
            try {
                int updated = cabinetUserService.backfillCampuses();
                if (updated > 0) {
                    log.info("Cabinet users: backfill campus для {} записей", updated);
                }
            } catch (RuntimeException e) {
                log.warn("Cabinet users: backfill campus не удался: {}", e.toString());
            }
        }, "cabinet-campus-backfill");
        t.setDaemon(true);
        t.start();
    }
}
