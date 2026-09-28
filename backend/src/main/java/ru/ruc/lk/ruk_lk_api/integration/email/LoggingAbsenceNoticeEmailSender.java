package ru.ruc.lk.ruk_lk_api.integration.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.unisender.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingAbsenceNoticeEmailSender implements AbsenceNoticeEmailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingAbsenceNoticeEmailSender.class);

    @Override
    public void sendAbsenceNotice(
        String toEmail,
        String recipientName,
        String studentFullName,
        String absenceDateRu,
        String violationsDetail,
        byte[] pdfBytes,
        String pdfFileName
    ) {
        log.info(
            "DEV: уведомление о непосещаемости на email={} recipient={} student={} date={} violations={} pdf={} ({} bytes)",
            toEmail,
            recipientName,
            studentFullName,
            absenceDateRu,
            violationsDetail,
            pdfFileName,
            pdfBytes == null ? 0 : pdfBytes.length
        );
    }
}
