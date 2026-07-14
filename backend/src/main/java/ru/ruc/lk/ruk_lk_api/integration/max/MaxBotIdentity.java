package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "true")
public class MaxBotIdentity {

    private static final Logger log = LoggerFactory.getLogger(MaxBotIdentity.class);

    private final MaxProperties properties;
    private volatile String resolvedUsername = "";

    public MaxBotIdentity(MaxProperties properties) {
        this.properties = properties;
    }

    public String botUsername() {
        String configured = properties.getBotUsername() == null ? "" : properties.getBotUsername().trim();
        if (!configured.isBlank()) {
            return configured;
        }
        return resolvedUsername;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(0)
    public void resolveUsername() {
        String configured = properties.getBotUsername() == null ? "" : properties.getBotUsername().trim();
        if (!configured.isBlank()) {
            this.resolvedUsername = configured;
            log.info("MAX bot username из конфига: {}", configured);
            return;
        }

        String botToken = properties.getBotToken() == null ? "" : properties.getBotToken().trim();
        if (botToken.isBlank()) {
            return;
        }

        try {
            RestClient client = RestClient.builder()
                .baseUrl(properties.getApiUrl())
                .defaultHeader("Authorization", botToken)
                .build();
            Map<String, Object> me = client.get()
                .uri("/me")
                .retrieve()
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            String username = extractUsername(me);
            if (!username.isBlank()) {
                this.resolvedUsername = username;
                log.info("MAX bot username из /me: {}", this.resolvedUsername);
                return;
            }
            log.warn("MAX /me: не удалось прочитать username, ответ={}", me);
        } catch (RestClientResponseException e) {
            log.error("MAX /me HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("MAX /me: ошибка", e);
        }
    }

    private static String extractUsername(Map<String, Object> me) {
        if (me == null) {
            return "";
        }
        Object direct = me.get("username");
        if (direct instanceof String s && !s.isBlank()) {
            return s.trim();
        }
        Object user = me.get("user");
        if (user instanceof Map<?, ?> userMap) {
            Object nested = userMap.get("username");
            if (nested instanceof String s && !s.isBlank()) {
                return s.trim();
            }
        }
        return "";
    }
}
