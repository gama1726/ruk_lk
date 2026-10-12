package ru.ruc.lk.ruk_lk_api.certificates;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CertificateRetentionScheduler {

    private static final Logger log = LoggerFactory.getLogger(CertificateRetentionScheduler.class);
    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");

    private final CertificateProperties properties;
    private final CertificateRequestRepository requestRepository;
    private final CertificateStorageService storageService;

    public CertificateRetentionScheduler(
        CertificateProperties properties,
        CertificateRequestRepository requestRepository,
        CertificateStorageService storageService
    ) {
        this.properties = properties;
        this.requestRepository = requestRepository;
        this.storageService = storageService;
    }

    /** Ежедневно в 03:15 МСК — чистка файлов старше retentionDays. */
    @Scheduled(cron = "0 15 3 * * *", zone = "Europe/Moscow")
    @Transactional
    public void purgeExpiredFiles() {
        int days = Math.max(1, properties.retentionDays());
        Instant closedBefore = Instant.now().minus(days, ChronoUnit.DAYS);
        LocalDate approvedEndedBefore = LocalDate.now(MOSCOW).minusDays(days);

        Set<CertificateRequestEntity> targets = new HashSet<>();
        targets.addAll(requestRepository.findClosedBefore(closedBefore));
        targets.addAll(requestRepository.findApprovedEndedBefore(approvedEndedBefore));

        int purged = 0;
        for (CertificateRequestEntity request : targets) {
            for (CertificateAttachmentEntity attachment : request.getAttachments()) {
                if (attachment.getPurgedAt() != null) {
                    continue;
                }
                storageService.delete(attachment.getStorageKey());
                attachment.markPurged();
                purged++;
            }
        }
        if (purged > 0) {
            log.info("Certificate retention: purged {} attachment(s)", purged);
        }
    }
}
