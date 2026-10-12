package ru.ruc.lk.ruk_lk_api.certificates;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(UnisenderCertificateNotificationMailer.class)
public class LoggingCertificateNotificationMailer implements CertificateNotificationMailer {

    private static final Logger log = LoggerFactory.getLogger(LoggingCertificateNotificationMailer.class);

    @Override
    public void send(String toEmail, String recipientName, String subject, String html, String plaintext) {
        log.info(
            "Certificate mail (log-only) to={} name={} subject={} body={}",
            toEmail,
            recipientName,
            subject,
            plaintext == null ? "" : plaintext.replace('\n', ' ')
        );
    }
}
