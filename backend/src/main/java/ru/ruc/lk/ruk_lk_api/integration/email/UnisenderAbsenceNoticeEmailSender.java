package ru.ruc.lk.ruk_lk_api.integration.email;

import java.util.Base64;
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

import ru.ruc.lk.ruk_lk_api.metrics.OutboundLoadMetrics;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundOperationContext;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

@Component
@ConditionalOnProperty(name = "app.unisender.enabled", havingValue = "true")
public class UnisenderAbsenceNoticeEmailSender implements AbsenceNoticeEmailSender {

    private static final Logger log = LoggerFactory.getLogger(UnisenderAbsenceNoticeEmailSender.class);
    private static final String FROM_NAME = "Личный кабинет РУК";

    private final RestClient restClient;
    private final String fromEmail;
    private final OutboundLoadMetrics outboundLoadMetrics;

    public UnisenderAbsenceNoticeEmailSender(
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
    public void sendAbsenceNotice(
        String toEmail,
        String recipientName,
        String studentFullName,
        String absenceDateRu,
        byte[] pdfBytes,
        String pdfFileName
    ) {
        OutboundOperationContext.call("send-absence-notice", () -> doSend(
            toEmail,
            recipientName,
            studentFullName,
            absenceDateRu,
            pdfBytes,
            pdfFileName
        ));
    }

    private void doSend(
        String toEmail,
        String recipientName,
        String studentFullName,
        String absenceDateRu,
        byte[] pdfBytes,
        String pdfFileName
    ) {
        String safeName = recipientName == null || recipientName.isBlank() ? "получатель" : recipientName.trim();
        String student = studentFullName == null || studentFullName.isBlank() ? "обучающийся" : studentFullName.trim();
        String date = absenceDateRu == null || absenceDateRu.isBlank() ? "—" : absenceDateRu.trim();
        String fileName = pdfFileName == null || pdfFileName.isBlank()
            ? "Uvedomlenie_o_neposeshchaemosti.pdf"
            : pdfFileName.replace('/', '_');

        String subject = "Уведомление об отсутствии обучающегося на занятиях";
        String html = """
            <p>Здравствуйте!</p>
            <p>Направляем уведомление об отсутствии обучающегося <strong>%s</strong>
            на учебных занятиях <strong>%s</strong>.</p>
            <p>Документ во вложении.</p>
            <p>Казанский кооперативный институт (филиал) РУК</p>
            """.formatted(escape(student), escape(date));
        String plaintext = "Здравствуйте!\n\nУведомление об отсутствии обучающегося "
            + student + " на учебных занятиях " + date + ".\nДокумент во вложении.";

        var attachment = new UnisenderSendRequest.Attachment(
            "application/pdf",
            fileName,
            Base64.getEncoder().encodeToString(pdfBytes)
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
            new UnisenderSendRequest.Body(html, plaintext),
            List.of("absence_notice"),
            List.of(attachment)
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
                    "send-absence-notice",
                    502,
                    "status=" + (response == null ? "null" : response.status())
                );
                throw new EmailSendException("UniSender вернул не success");
            }
            log.info("Уведомление о непосещаемости отправлено на {}, job_id={}", maskEmail(toEmail), response.job_id());
        } catch (RestClientResponseException e) {
            log.error("UniSender HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new EmailSendException("Не удалось отправить уведомление на email", e);
        }
    }

    private static String escape(String value) {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
