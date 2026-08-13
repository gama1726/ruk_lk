package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.List;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "true")
public class MaxOutboundMessages {

    private final RestClient restClient;
    private final String botToken;

    public MaxOutboundMessages(MaxProperties properties) {
        this.botToken = properties.getBotToken() == null ? "" : properties.getBotToken().trim();
        this.restClient = RestClient.builder()
            .baseUrl(properties.getApiUrl())
            .defaultHeader("Authorization", this.botToken)
            .build();
    }

    boolean isConfigured() {
        return !botToken.isBlank();
    }

    void sendText(long maxUserId, String text) {
        postMessage(maxUserId, Map.of("text", text));
    }

    void sendPhoneVerificationRequest(long maxUserId, String maskedPhone) {
        String text =
            "Для привязки личного кабинета РУК подтвердите номер телефона из базы университета: "
                + maskedPhone + ".\n\n"
                + "Нажмите кнопку ниже — MAX отправит номер, привязанный к вашему аккаунту.";
        Map<String, Object> body = Map.of(
            "text", text,
            "attachments", List.of(
                Map.of(
                    "type", "inline_keyboard",
                    "payload", Map.of(
                        "buttons", List.of(
                            List.of(
                                Map.of(
                                    "type", "request_contact",
                                    "text", "Поделиться номером"
                                )
                            )
                        )
                    )
                )
            )
        );
        postMessage(maxUserId, body);
    }

    void sendBindRejectedWrongPhone(long maxUserId, String maskedPhone) {
        sendText(
            maxUserId,
            "Не удалось привязать MAX: номер в мессенджере не совпадает с "
                + maskedPhone + " из базы университета.\n\n"
                + "Обновите телефон в институте или войдите через email."
        );
    }

    void sendBindRejectedInvalidContact(long maxUserId) {
        sendText(
            maxUserId,
            "Не удалось подтвердить номер. Нажмите кнопку «Поделиться номером» под сообщением бота, "
                + "не отправляйте контакт вручную из телефонной книги."
        );
    }

    private void postMessage(long maxUserId, Map<String, Object> body) {
        if (!isConfigured()) {
            throw new MaxSendException("MAX не настроен: укажите app.max.bot-token");
        }
        try {
            restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/messages").queryParam("user_id", maxUserId).build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new MaxSendException("Не удалось отправить сообщение в MAX: HTTP " + e.getStatusCode(), e);
        } catch (RestClientException e) {
            throw new MaxSendException("Не удалось отправить сообщение в MAX: " + e.getMessage(), e);
        }
    }
}
