package ru.ruc.lk.ruk_lk_api.integration.email;

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

@Component
@ConditionalOnProperty(name = "app.unisender.enabled", havingValue = "true")
public class UnisenderEmailSender implements VerificationEmailSender {

    private static final Logger log = LoggerFactory.getLogger(UnisenderEmailSender.class);
    private static final String FROM_NAME = "Личный кабинет РУК";

    private final RestClient restClient;
    private final String fromEmail;

    public UnisenderEmailSender(
        @Value("${app.unisender.base-url}") String baseUrl,
        @Value("${app.unisender.api-key}") String apiKey,
        @Value("${app.unisender.from-email}") String fromEmail
    ) {
        this.fromEmail = fromEmail;
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("X-API-KEY", apiKey)
            .build();
    }

    @Override
    public void sendLoginCode(String toEmail, String recipientName, String code) {
        sendCode(
            toEmail,
            recipientName,
            code,
            "Код для входа в личный кабинет РУК",
            "Код для входа в личный кабинет РУК",
            "login_code"
        );
    }

    @Override
    public void sendEmailChangeCode(String toEmail, String recipientName, String code) {
        sendCode(
            toEmail,
            recipientName,
            code,
            "Код для смены почты в личном кабинете РУК",
            "Код для подтверждения смены почты в личном кабинете РУК",
            "email_change_code"
        );
    }

    private void sendCode(
        String toEmail,
        String recipientName,
        String code,
        String subject,
        String codeLabel,
        String tag
    ) {
        String safeName = recipientName == null || recipientName.isBlank()
            ? "Студент"
            : recipientName.trim();
        String greeting = buildGreeting(recipientName);

        String html = """
            <p>%s</p>
            <p>%s: <strong>%s</strong></p>
            <p>Никому не сообщайте этот код.</p>
            """.formatted(greeting, codeLabel, code);

        String plaintext = greeting + "\n\n" + codeLabel + ": " + code
            + "\n\nНикому не сообщайте этот код.";

        var body = new UnisenderSendRequest.Body(html, plaintext);
        var recipient = new UnisenderSendRequest.Recipient(
            toEmail,
            Map.of("to_name", safeName)
        );
        var message = new UnisenderSendRequest.Message(
            List.of(recipient),
            subject,
            fromEmail,
            FROM_NAME,
            "ru",
            "none",
            0,
            0,
            body,
            List.of(tag)
        );

        try {
            UnisenderSendResponse response = restClient.post()
                .uri("/email/send.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UnisenderSendRequest(message))
                .retrieve()
                .body(UnisenderSendResponse.class);

            if (response == null || !"success".equals(response.status())) {
                throw new EmailSendException("UniSender вернул не success");
            }
            log.info("Код ({}) отправлен на {}, job_id={}", tag, maskEmail(toEmail), response.job_id());
        } catch (RestClientResponseException e) {
            log.error("UniSender HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new EmailSendException("Не удалось отправить письмо", e);
        }
    }

    private static String buildGreeting(String fullName) {
        String nameAndPatronymic = firstNameAndPatronymic(fullName);
        if (nameAndPatronymic == null) {
            return "Здравствуйте!";
        }
        return "Здравствуйте, " + nameAndPatronymic + "!";
    }

    /** Из «Фамилия Имя Отчество» — «Имя Отчество» (или только имя). */
    private static String firstNameAndPatronymic(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return null;
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length >= 3) {
            return parts[1] + " " + parts[2];
        }
        if (parts.length == 2) {
            return parts[1];
        }
        return null;
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
