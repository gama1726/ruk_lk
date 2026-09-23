package ru.ruc.lk.ruk_lk_api.integration.pulse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

/**
 * Мост ЛК → pulse.ruc.su: server-to-server exchange, затем redirect с ticket.
 * В теле — профиль студента без данных об оплате.
 */
@Component
public class PulseBridgeClient {

    private static final Logger log = LoggerFactory.getLogger(PulseBridgeClient.class);
    private static final String EMPTY_EMAIL = "—";

    private final RestClient restClient;
    private final StudentService studentService;
    private final String exchangeSecret;
    private final String frontendUrl;
    private final String exchangePath;
    private final String callbackPath;
    private final boolean enabled;
    private final boolean configured;

    public PulseBridgeClient(
        @Value("${app.pulse.enabled:false}") boolean enabled,
        @Value("${app.pulse.api-base-url:}") String apiBaseUrl,
        @Value("${app.pulse.frontend-url:}") String frontendUrl,
        @Value("${app.pulse.exchange-secret:}") String exchangeSecret,
        @Value("${app.pulse.exchange-path:/api/internal/lk/exchange}") String exchangePath,
        @Value("${app.pulse.callback-path:/account/lk/callback}") String callbackPath,
        StudentService studentService,
        OutboundRestClients outboundRestClients
    ) {
        this.studentService = studentService;
        this.enabled = enabled;
        this.exchangeSecret = exchangeSecret == null ? "" : exchangeSecret.trim();
        this.frontendUrl = trimSlash(frontendUrl);
        this.exchangePath = exchangePath == null || exchangePath.isBlank()
            ? "/api/internal/lk/exchange"
            : (exchangePath.startsWith("/") ? exchangePath : "/" + exchangePath);
        this.callbackPath = callbackPath == null || callbackPath.isBlank()
            ? "/account/lk/callback"
            : (callbackPath.startsWith("/") ? callbackPath : "/" + callbackPath);
        String base = trimSlash(apiBaseUrl);
        this.configured = !blank(base) && !blank(this.frontendUrl) && !blank(this.exchangeSecret);
        this.restClient = outboundRestClients.builder("pulse")
            .baseUrl(blank(base) ? "http://localhost" : base)
            .build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isConfigured() {
        return configured;
    }

    public String callbackUrl(StudentSession student) {
        if (!enabled) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Вход на pulse.ruc.su временно отключён"
            );
        }
        if (!configured) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Мост pulse.ruc.su не настроен"
            );
        }
        if (student == null || blank(student.studentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "В сессии нет данных студента");
        }

        StudentProfileResponse profile = studentService.getProfileForStudentId(student.studentId());

        PulseExchangeRequest body = new PulseExchangeRequest(
            exchangeSecret,
            profile.studentId(),
            profile.fullName(),
            emailOrDash(profile),
            blankToEmpty(profile.phone()),
            blankToEmpty(profile.gender()),
            blankToEmpty(profile.birthDate()),
            blankToEmpty(profile.funding()),
            blankToEmpty(profile.status()),
            blankToEmpty(profile.faculty()),
            blankToEmpty(profile.branch()),
            blankToEmpty(profile.department()),
            blankToEmpty(profile.direction()),
            blankToEmpty(profile.directionGUID()),
            blankToEmpty(profile.level()),
            blankToEmpty(profile.educationForm()),
            blankToEmpty(profile.group()),
            blankToEmpty(profile.course())
        );

        try {
            PulseExchangeResponse response = restClient.post()
                .uri(exchangePath)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(PulseExchangeResponse.class);

            if (response == null || blank(response.ticket())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "pulse.ruc.su не выдал ticket");
            }
            String ticket = URLEncoder.encode(response.ticket().trim(), StandardCharsets.UTF_8);
            return frontendUrl + callbackPath + "?ticket=" + ticket;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.warn("pulse exchange HTTP {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось открыть pulse.ruc.su",
                e
            );
        } catch (RestClientException e) {
            log.warn("pulse exchange I/O: {}", e.getMessage());
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "pulse.ruc.su недоступен",
                e
            );
        }
    }

    private static String emailOrDash(StudentProfileResponse profile) {
        if (!blank(profile.email())) {
            return profile.email().trim();
        }
        return EMPTY_EMAIL;
    }

    private static String trimSlash(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
