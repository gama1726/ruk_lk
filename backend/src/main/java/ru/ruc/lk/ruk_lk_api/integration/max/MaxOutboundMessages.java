package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.List;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import ru.ruc.lk.ruk_lk_api.metrics.OutboundOperationContext;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "true")
public class MaxOutboundMessages {

    private final RestClient restClient;
    private final RestClient uploadRestClient;
    private final String botToken;

    public MaxOutboundMessages(MaxProperties properties, OutboundRestClients outboundRestClients) {
        this.botToken = properties.getBotToken() == null ? "" : properties.getBotToken().trim();
        this.restClient = outboundRestClients.builder("max")
            .baseUrl(properties.getApiUrl())
            .defaultHeader("Authorization", this.botToken)
            .build();
        this.uploadRestClient = outboundRestClients.builder("max-upload").build();
    }

    public boolean isConfigured() {
        return !botToken.isBlank();
    }

    void sendText(long maxUserId, String text) {
        OutboundOperationContext.call("bind-notify", () -> postMessage(maxUserId, Map.of("text", text)));
    }

    /**
     * Загрузка файла ({@code POST /uploads?type=file}) и отправка сообщением с вложением.
     */
    public void sendFile(long maxUserId, String text, byte[] fileBytes, String fileName) {
        OutboundOperationContext.call("send-file", () -> {
            String token = uploadFile(fileBytes, fileName);
            Map<String, Object> body = Map.of(
                "text", text == null ? "" : text,
                "attachments", List.of(
                    Map.of(
                        "type", "file",
                        "payload", Map.of("token", token)
                    )
                )
            );
            postMessage(maxUserId, body);
        });
    }

    private String uploadFile(byte[] fileBytes, String fileName) {
        if (!isConfigured()) {
            throw new MaxSendException("MAX не настроен: укажите app.max.bot-token");
        }
        if (fileBytes == null || fileBytes.length == 0) {
            throw new MaxSendException("Пустой файл для отправки в MAX");
        }
        String safeName = fileName == null || fileName.isBlank() ? "document.pdf" : fileName;

        Map<String, Object> init;
        try {
            init = restClient.post()
                .uri(uriBuilder -> uriBuilder.path("/uploads").queryParam("type", "file").build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        } catch (RestClientResponseException e) {
            throw new MaxSendException("MAX /uploads HTTP " + e.getStatusCode(), e);
        } catch (RestClientException e) {
            throw new MaxSendException("MAX /uploads: " + e.getMessage(), e);
        }
        if (init == null || init.get("url") == null) {
            throw new MaxSendException("MAX /uploads не вернул url");
        }
        String uploadUrl = String.valueOf(init.get("url"));

        // Servlet multipart без MultipartBodyBuilder — иначе нужен org.reactivestreams.Publisher
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_PDF);
        ByteArrayResource resource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return safeName;
            }
        };
        MultiValueMap<String, Object> multipart = new LinkedMultiValueMap<>();
        multipart.add("data", new HttpEntity<>(resource, fileHeaders));

        Map<String, Object> uploaded;
        try {
            uploaded = uploadRestClient.post()
                .uri(uploadUrl)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(multipart)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        } catch (RestClientResponseException e) {
            throw new MaxSendException("MAX upload HTTP " + e.getStatusCode(), e);
        } catch (RestClientException e) {
            throw new MaxSendException("MAX upload: " + e.getMessage(), e);
        }

        Object token = uploaded == null ? null : uploaded.get("token");
        if (token == null && init.get("token") != null) {
            token = init.get("token");
        }
        if (token == null || String.valueOf(token).isBlank()) {
            throw new MaxSendException("MAX upload не вернул token");
        }
        return String.valueOf(token);
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
        OutboundOperationContext.call("bind-request-phone", () -> postMessage(maxUserId, body));
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
