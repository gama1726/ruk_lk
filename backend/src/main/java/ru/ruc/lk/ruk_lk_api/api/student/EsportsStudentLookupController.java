package ru.ruc.lk.ruk_lk_api.api.student;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.integration.esports.EsportsStudentLookupRequest;
import ru.ruc.lk.ruk_lk_api.integration.esports.EsportsStudentLookupResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

/**
 * Внутренний lookup для киберспорта: studentId → ФИО через 1С.
 * Сначала {@code /hs/student/auth}, затем fallback на {@code /hs/student/profile}.
 * Защита — shared secret (тот же, что для exchange).
 */
@RestController
@RequestMapping("/api/internal/esports")
public class EsportsStudentLookupController {

    private final OneCClient onecClient;
    private final String exchangeSecret;

    public EsportsStudentLookupController(
        OneCClient onecClient,
        @Value("${app.esports.exchange-secret:}") String exchangeSecret
    ) {
        this.onecClient = onecClient;
        this.exchangeSecret = exchangeSecret == null ? "" : exchangeSecret;
    }

    @PostMapping("/student-lookup")
    public EsportsStudentLookupResponse lookup(@RequestBody EsportsStudentLookupRequest request) {
        if (request == null || blank(request.studentId()) || blank(request.sharedSecret())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Недостаточно данных");
        }
        if (blank(exchangeSecret) || !secretsEqual(exchangeSecret, request.sharedSecret())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Некорректный ключ обмена");
        }
        String studentId = normalizeStudentId(request.studentId());
        if (studentId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите номер зачётки");
        }

        String fullName = resolveFullName(studentId);
        if (blank(fullName)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Студент с таким номером зачётки не найден в 1С"
            );
        }
        return new EsportsStudentLookupResponse(studentId, fullName.trim());
    }

    private String resolveFullName(String studentId) {
        MeResponse auth = onecClient.login(studentId).orElse(null);
        if (auth != null && !blank(auth.fullName())) {
            return auth.fullName().trim();
        }
        // auth бывает false для части зачёток, при этом профиль в 1С есть
        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        if (profile != null && !blank(profile.fullName())) {
            return profile.fullName().trim();
        }
        return null;
    }

    private static String normalizeStudentId(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().replace(" ", "");
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static boolean secretsEqual(String expected, String actual) {
        byte[] left = expected.getBytes(StandardCharsets.UTF_8);
        byte[] right = actual.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(left, right);
    }
}
