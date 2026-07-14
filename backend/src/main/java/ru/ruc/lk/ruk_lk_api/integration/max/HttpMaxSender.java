package ru.ruc.lk.ruk_lk_api.integration.max;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public HttpMaxSender(MaxProperties properties) {
        this.botToken = properties.getBotToken() == null ? "" : properties.getBotToken().trim();
        this.restClient = RestClient.builder()
            .baseUrl(properties.getApiUrl())
            .defaultHeader("Authorization", this.botToken)
            .build();
    }

    @Override
    public boolean isConfigured() {
        return !botToken.isBlank();
    }

    @Override
    public void sendMessage(long maxUserId, String text) {
        if (!isConfigured()) {
            throw new MaxSendException("MAX не настроен: укажите app.max.bot-token");
        }

        try {
            restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/messages").queryParam("user_id", maxUserId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(new MaxMessageRequest(text))
                .retrieve()
                .toBodilessEntity();
            log.info("Сообщение отправлено в MAX, user_id={}", maxUserId);
        } catch (RestClientResponseException e) {
            log.error("MAX HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new MaxSendException("Не удалось отправить сообщение в MAX", e);
        }
    }

    private record MaxMessageRequest(String text) {}
}
