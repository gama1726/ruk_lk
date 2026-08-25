package ru.ruc.lk.ruk_lk_api.integration.esports;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;

@Component
public class EsportsBridgeClient {

    private final RestClient restClient;
    private final String exchangeSecret;
    private final String frontendUrl;

    public EsportsBridgeClient(
        @Value("${app.esports.api-base-url}") String apiBaseUrl,
        @Value("${app.esports.exchange-secret}") String exchangeSecret,
        @Value("${app.esports.frontend-url}") String frontendUrl
    ) {
        this.exchangeSecret = exchangeSecret;
        this.frontendUrl = trimSlash(frontendUrl);
        this.restClient = RestClient.builder()
            .baseUrl(trimSlash(apiBaseUrl))
            .build();
    }

    public String callbackUrl(StudentSession student) {
        if (student == null || blank(student.studentId()) || blank(student.fullName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "В сессии нет данных студента");
        }
        if (blank(exchangeSecret)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Мост киберспорта не настроен");
        }
        try {
            TokenResponse body = restClient.post()
                .uri("/api/student/exchange")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "studentId", student.studentId().trim(),
                    "fullName", student.fullName().trim(),
                    "email", emailOrFallback(student),
                    "sharedSecret", exchangeSecret
                ))
                .retrieve()
                .body(TokenResponse.class);
            if (body == null || blank(body.token())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Кабинет киберспорта не выдал токен");
            }
            return frontendUrl + "/student/callback?token=" + java.net.URLEncoder.encode(body.token(), StandardCharsets.UTF_8);
        } catch (RestClientResponseException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось открыть кабинет киберспорта",
                e
            );
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Кабинет киберспорта недоступен",
                e
            );
        }
    }

    private static String emailOrFallback(StudentSession student) {
        if (!blank(student.email())) {
            return student.email().trim();
        }
        return student.studentId().trim() + "@student.ruc.su";
    }

    private static String trimSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private record TokenResponse(String token, String email) {}
}
