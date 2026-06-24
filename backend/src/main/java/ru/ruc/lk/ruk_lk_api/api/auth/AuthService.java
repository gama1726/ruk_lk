package ru.ruc.lk.ruk_lk_api.api.auth;

import java.security.SecureRandom;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginChallengeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String SESSION_KEY = "STUDENT";
    private static final String PENDING_KEY = "PENDING_CHALLENGE";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OneCClient onecClient;
    private final String fixedCode;

    public AuthService(
        OneCClient onecClient,
        @Value("${app.auth.fixed-code:}") String fixedCode
    ) {
        this.onecClient = onecClient;
        this.fixedCode = fixedCode;
    }

    /**
     * Шаг 1: проверка зачётки и пароля в 1С, отправка кода на почту из 1С.
     */
    public LoginChallengeResponse startLoginChallenge(String studentId, String password, HttpSession session) {
        MeResponse me = onecClient
            .login(studentId, password)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Неверный номер зачётки или пароль"
            ));

        String email = resolveEmail(me);
        String code = generateCode();

        session.setAttribute(PENDING_KEY, new PendingChallenge(
            me.studentId(),
            me.fullName(),
            email,
            code,
            me.programs()
        ));
        session.removeAttribute(SESSION_KEY);

        sendVerificationCode(email, code);

        return new LoginChallengeResponse(me.studentId(), email, me.fullName());
    }

    /**
     * Шаг 2: подтверждение кода из письма, создание сессии.
     */
    public MeResponse verifyCode(String code, HttpSession session) {
        Object raw = session.getAttribute(PENDING_KEY);
        if (!(raw instanceof PendingChallenge pending)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Сначала войдите по номеру зачётки и паролю"
            );
        }

        String digits = code == null ? "" : code.replaceAll("\\s", "");
        if (!pending.code().equals(digits)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный код подтверждения");
        }

        StudentSession student = new StudentSession(
            pending.studentId(),
            pending.fullName(),
            pending.email(),
            pending.programs()
        );
        session.setAttribute(SESSION_KEY, student);
        session.removeAttribute(PENDING_KEY);

        return toMeResponse(student);
    }

    public Optional<MeResponse> currentUser(HttpSession session) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            return Optional.empty();
        }
        return Optional.of(toMeResponse(student));
    }

    public Optional<LoginChallengeResponse> pendingChallenge(HttpSession session) {
        Object raw = session.getAttribute(PENDING_KEY);
        if (!(raw instanceof PendingChallenge pending)) {
            return Optional.empty();
        }
        return Optional.of(new LoginChallengeResponse(
            pending.studentId(),
            pending.email(),
            pending.fullName()
        ));
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    private MeResponse toMeResponse(StudentSession student) {
        return new MeResponse(
            student.studentId(),
            student.fullName(),
            student.email(),
            student.programs()
        );
    }

    private String resolveEmail(MeResponse me) {
        if (me.email() != null && !me.email().isBlank()) {
            return me.email().trim();
        }
        log.warn("Почта студента не пришла из 1С для {}, используем заглушку до доработки HTTP-сервиса", me.studentId());
        return me.studentId() + "@student.ruc.local";
    }

    private String generateCode() {
        if (fixedCode != null && !fixedCode.isBlank()) {
            return fixedCode.trim();
        }
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /** TODO: интеграция с почтовым сервисом; пока код в логах сервера. */
    private void sendVerificationCode(String email, String code) {
        log.info("Код подтверждения входа для {}: {}", email, code);
    }
}
