package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import ru.ruc.lk.ruk_lk_api.integration.email.EmailSendException;
import ru.ruc.lk.ruk_lk_api.integration.email.UnisenderSendRequest;
import ru.ruc.lk.ruk_lk_api.integration.email.UnisenderSendResponse;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundLoadMetrics;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundOperationContext;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

@Component
@ConditionalOnProperty(name = "app.unisender.enabled", havingValue = "true")
public class UnisenderCertificateNotificationMailer implements CertificateNotificationMailer {

    private static final Logger log = LoggerFactory.getLogger(UnisenderCertificateNotificationMailer.class);
    private static final String FROM_NAME = "Личный кабинет РУК";

    private final RestClient restClient;
    private final String fromEmail;
    private final OutboundLoadMetrics outboundLoadMetrics;

    public UnisenderCertificateNotificationMailer(
        @Value("${app.unisender.base-url}") String baseUrl,
        @Value("${app.unisender.api-key}") String apiKey,
        @Value("${app.unisender.from-email}") String fromEmail,
        OutboundRestClients outboundRestClients,
        OutboundLoadMetrics outboundLoadMetrics
    ) {
        this.fromEmail = fromEmail;
        this.outboundLoadMetrics = outboundLoadMetrics;
        this.restClient = outboundRestClients.builder("unisender")
            .baseUrl(baseUrl)
            .defaultHeader("X-API-KEY", apiKey)
            .build();
    }

    @Override
    public void send(String toEmail, String recipientName, String subject, String html, String plaintext) {
        OutboundOperationContext.call("send-certificate-notice", () -> doSend(
            toEmail, recipientName, subject, html, plaintext
        ));
    }

    private void doSend(String toEmail, String recipientName, String subject, String html, String plaintext) {
        String safeName = recipientName == null || recipientName.isBlank() ? "получатель" : recipientName.trim();
        var body = new UnisenderSendRequest.Body(
            html == null ? "" : html,
            plaintext == null ? "" : plaintext
        );
        var message = new UnisenderSendRequest.Message(
            List.of(new UnisenderSendRequest.Recipient(toEmail, Map.of("to_name", safeName))),
            subject,
            fromEmail,
            FROM_NAME,
            "ru",
            "none",
            0,
            0,
            body,
            List.of("certificate-notice")
        );
        try {
            UnisenderSendResponse response = restClient.post()
                .uri("/email/send.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UnisenderSendRequest(message))
                .retrieve()
                .body(UnisenderSendResponse.class);
            if (response == null || !"success".equals(response.status())) {
                outboundLoadMetrics.recordApplicationError(
                    "unisender",
                    "send-certificate-notice",
                    502,
                    "status=" + (response == null ? "null" : response.status())
                );
                throw new EmailSendException("UniSender вернул не success");
            }
            log.info("Certificate notice sent to {}, job_id={}", mask(toEmail), response.job_id());
        } catch (RestClientResponseException e) {
            log.error("UniSender HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new EmailSendException("Не удалось отправить письмо", e);
        }
    }

    private static String mask(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
