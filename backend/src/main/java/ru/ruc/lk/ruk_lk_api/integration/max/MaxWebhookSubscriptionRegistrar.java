package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "true")
public class MaxWebhookSubscriptionRegistrar {

    private static final Logger log = LoggerFactory.getLogger(MaxWebhookSubscriptionRegistrar.class);

    private final MaxProperties properties;

    public MaxWebhookSubscriptionRegistrar(MaxProperties properties) {
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void registerWebhook() {
        String webhookUrl = properties.getWebhookUrl() == null ? "" : properties.getWebhookUrl().trim();
        String botToken = properties.getBotToken() == null ? "" : properties.getBotToken().trim();
        if (webhookUrl.isBlank() || botToken.isBlank()) {
            log.info("MAX webhook: автоподписка пропущена (нет app.max.webhook-url или bot-token)");
            return;
        }

        RestClient client = RestClient.builder()
            .baseUrl(properties.getApiUrl())
            .defaultHeader("Authorization", botToken)
            .build();

        try {
            var body = new java.util.LinkedHashMap<String, Object>();
            body.put("url", webhookUrl);
            body.put("update_types", List.of("bot_started"));
            String secret = properties.getWebhookSecret() == null ? "" : properties.getWebhookSecret().trim();
            if (!secret.isBlank()) {
                body.put("secret", secret);
            }

            client.post()
                .uri("/subscriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
            log.info("MAX webhook подписан: {}", webhookUrl);
        } catch (RestClientResponseException e) {
            log.error(
                "MAX webhook: не удалось подписаться ({}): {}",
                e.getStatusCode(),
                e.getResponseBodyAsString()
            );
        } catch (Exception e) {
            log.error("MAX webhook: ошибка подписки", e);
        }
    }
}
