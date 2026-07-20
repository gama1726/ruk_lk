package ru.ruc.lk.ruk_lk_api.passphoto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * После рестарта API заявки в PERCO_SYNCING больше не видны в очереди/истории —
 * переводим их в PERCO_FAILED.
 */
@Component
public class PassPhotoStuckSyncRecovery {

    private static final Logger log = LoggerFactory.getLogger(PassPhotoStuckSyncRecovery.class);

    private final PassPhotoService passPhotoService;

    public PassPhotoStuckSyncRecovery(PassPhotoService passPhotoService) {
        this.passPhotoService = passPhotoService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recoverOnStartup() {
        int recovered = passPhotoService.recoverStuckSyncing();
        if (recovered > 0) {
            log.warn("Pass-photo: восстановлено {} зависших заявок PERCO_SYNCING → PERCO_FAILED", recovered);
        }
    }
}
