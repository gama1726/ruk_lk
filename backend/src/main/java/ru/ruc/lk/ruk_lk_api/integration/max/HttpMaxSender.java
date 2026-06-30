package ru.ruc.lk.ruk_lk_api.integration.max;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "true")
public class HttpMaxSender implements VerificationMaxSender {

    private static final Logger log = LoggerFactory.getLogger(HttpMaxSender.class);

    private final RestClient restClient;
    private final String botToken;

    public HttpMaxSender(
        @Value("${app.max.api-url:https://platform-api2.max.ru}") String apiUrl,
        @Value("${app.max.bot-token:}") String botToken
    ) {
        this.botToken = botToken == null ? "" : botToken.trim();
        this.restClient = RestClient.builder()
            .baseUrl(apiUrl)
            .defaultHeader("Authorization", this.botToken)
            .build();
    }

    @Override
    public boolean isConfigured() {
        return !botToken.isBlank();
    }

    @Override
    public void sendLoginCode(long maxUserId, String recipientName, String code) {
        if (!isConfigured()) {
            throw new MaxSendException("MAX не настроен: укажите app.max.bot-token");
        }

        String safeName = recipientName == null || recipientName.isBlank()
            ? "студент"
            : recipientName.trim();
        String text = "Здравствуйте, " + safeName + "!\n\n"
            + "Код для входа в личный кабинет РУК: " + code + "\n\n"
            + "Никому не сообщайте этот код.";

        try {
            restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/messages").queryParam("user_id", maxUserId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(new MaxMessageRequest(text))
                .retrieve()
                .toBodilessEntity();
            log.info("Код входа отправлен в MAX, user_id={}", maxUserId);
        } catch (RestClientResponseException e) {
            log.error("MAX HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new MaxSendException("Не удалось отправить код в MAX", e);
        }
    }

    private record MaxMessageRequest(String text) {}
}
