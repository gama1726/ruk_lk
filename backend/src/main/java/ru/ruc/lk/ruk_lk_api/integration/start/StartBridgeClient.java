package ru.ruc.lk.ruk_lk_api.integration.start;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

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
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

/**
 * Мост ЛК → start.ruc.su: server-to-server exchange, затем redirect с ticket.
 */
@Component
public class StartBridgeClient {

    private static final Logger log = LoggerFactory.getLogger(StartBridgeClient.class);

    private final RestClient restClient;
    private final StudentService studentService;
    private final String exchangeSecret;
    private final String frontendUrl;
    private final String exchangePath;
    private final String callbackPath;
    private final boolean enabled;
    private final boolean configured;
    /** Временный костыль: для Start — ok при любой оплате в графике (в т.ч. частичной). */
    private final boolean firstMonthOnly;

    public StartBridgeClient(
        @Value("${app.start.enabled:false}") boolean enabled,
        @Value("${app.start.api-base-url:}") String apiBaseUrl,
        @Value("${app.start.frontend-url:}") String frontendUrl,
        @Value("${app.start.exchange-secret:}") String exchangeSecret,
        @Value("${app.start.exchange-path:/api/internal/lk/exchange}") String exchangePath,
        @Value("${app.start.callback-path:/account/lk/callback}") String callbackPath,
        @Value("${app.start.first-month-only:false}") boolean firstMonthOnly,
        StudentService studentService,
        OutboundRestClients outboundRestClients
    ) {
        this.studentService = studentService;
        this.enabled = enabled;
        this.firstMonthOnly = firstMonthOnly;
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
        this.restClient = outboundRestClients.builder("start")
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
                "Вход на start.ruc.su временно отключён"
            );
        }
        if (!configured) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Мост start.ruc.su не настроен"
            );
        }
        if (student == null || blank(student.studentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "В сессии нет данных студента");
        }

        StudentProfileResponse profile = studentService.getProfileForStudentId(student.studentId());
        PaymentSnapshot payment = loadPayment(student.studentId());

        StartExchangeRequest body = new StartExchangeRequest(
            exchangeSecret,
            profile.studentId(),
            profile.fullName(),
            emailOrFallback(profile),
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
            blankToEmpty(profile.course()),
            payment.status(),
            payment.found(),
            payment.contractNumber(),
            payment.contractDate(),
            payment.nextDate(),
            payment.nextAmount()
        );

        try {
            StartExchangeResponse response = restClient.post()
                .uri(exchangePath)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(StartExchangeResponse.class);

            if (response == null || blank(response.ticket())) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "start.ruc.su не выдал ticket");
            }
            String ticket = URLEncoder.encode(response.ticket().trim(), StandardCharsets.UTF_8);
            return frontendUrl + callbackPath + "?ticket=" + ticket;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.warn("start exchange HTTP {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось открыть start.ruc.su",
                e
            );
        } catch (RestClientException e) {
            log.warn("start exchange I/O: {}", e.getMessage());
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "start.ruc.su недоступен",
                e
            );
        }
    }

    private PaymentSnapshot loadPayment(String studentId) {
        try {
            StudentPaymentsResponse payments = studentService.getPaymentsForStudentId(studentId, LocalDate.now());
            String status = blank(payments.status()) ? "unknown" : payments.status().trim();
            if (firstMonthOnly) {
                status = statusByFirstMonthOnly(payments, studentId);
            }
            String contractNumber = payments.contract() == null ? "" : blankToEmpty(payments.contract().number());
            String contractDate = payments.contract() == null ? "" : blankToEmpty(payments.contract().date());
            return new PaymentSnapshot(
                payments.paymentFound(),
                status,
                contractNumber,
                contractDate,
                blankToEmpty(payments.nextDate()),
                payments.nextAmount()
            );
        } catch (Exception e) {
            log.info("start exchange: оплата недоступна для {}: {}", studentId, e.getMessage());
            return new PaymentSnapshot(false, "not_found", "", "", "", null);
        }
    }

    /**
     * Временный костыль ({@code app.start.first-month-only}): для Start — {@code ok},
     * если в графике есть хотя бы один платёж с {@code paid > 0} (включая частичный).
     * Полная оплата месяца не требуется. Раздел «Оплаты» в ЛК не затрагивается.
     */
    private String statusByFirstMonthOnly(StudentPaymentsResponse payments, String studentId) {
        var schedule = payments.schedule();
        if (schedule == null || schedule.isEmpty()) {
            log.info(
                "start first-month-only: пустой график для {}, status={}",
                studentId,
                blank(payments.status()) ? "unknown" : payments.status()
            );
            return "overdue";
        }
        var withPaid = schedule.stream()
            .filter(s -> s != null && s.paid() > 0.009)
            .findFirst();
        boolean anyPaid = withPaid.isPresent();
        String status = anyPaid ? "ok" : "overdue";
        if (anyPaid) {
            var hit = withPaid.get();
            log.info(
                "start first-month-only: studentId={} payment#{} paid={} statusIn={} → exchange={}",
                studentId,
                hit.number(),
                hit.paid(),
                hit.status(),
                status
            );
        } else {
            log.info(
                "start first-month-only: studentId={} нет оплат в графике ({} строк) → exchange={}",
                studentId,
                schedule.size(),
                status
            );
        }
        return status;
    }

    private static String emailOrFallback(StudentProfileResponse profile) {
        if (!blank(profile.email())) {
            return profile.email().trim();
        }
        return "—";
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

    private record PaymentSnapshot(
        boolean found,
        String status,
        String contractNumber,
        String contractDate,
        String nextDate,
        Double nextAmount
    ) {}
}
