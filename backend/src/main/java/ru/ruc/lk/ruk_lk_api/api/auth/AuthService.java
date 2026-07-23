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

import ru.ruc.lk.ruk_lk_api.api.auth.dto.AuthChannelsDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.IdentifyResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginChallengeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MaxBindLinkResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.integration.email.EmailSendException;
import ru.ruc.lk.ruk_lk_api.integration.email.VerificationEmailSender;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxBindingService;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxSendException;
import ru.ruc.lk.ruk_lk_api.integration.max.VerificationMaxSender;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleContextService;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String SESSION_KEY = "STUDENT";
    private static final String PENDING_IDENTIFICATION_KEY = "PENDING_IDENTIFICATION";
    private static final String PENDING_KEY = "PENDING_CHALLENGE";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OneCClient onecClient;
    private final VerificationEmailSender emailSender;
    private final VerificationMaxSender maxSender;
    private final MaxBindingService maxBindingService;
    private final ScheduleContextService scheduleContextService;
    private final String fixedCode;

    public AuthService(
        OneCClient onecClient,
        VerificationEmailSender emailSender,
        VerificationMaxSender maxSender,
        MaxBindingService maxBindingService,
        ScheduleContextService scheduleContextService,
        @Value("${app.auth.fixed-code:}") String fixedCode
    ) {
        this.onecClient = onecClient;
        this.emailSender = emailSender;
        this.maxSender = maxSender;
        this.maxBindingService = maxBindingService;
        this.scheduleContextService = scheduleContextService;
        this.fixedCode = fixedCode;
    }

    public AuthChannelsDto loginChannels() {
        return new AuthChannelsDto(maxBindingService.isLoginChannelEnabled());
    }

    /** Шаг 1: проверка зачётки в 1С, сохранение данных для выбора канала. */
    public IdentifyResponse identify(String studentId, HttpSession session) {
        MeResponse me = onecClient
            .login(studentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Студент с таким номером зачётки не найден"
            ));

        String email = resolveEmail(me);
        String phone = blankToEmpty(me.phone());
        Long maxUserId = maxBindingService.findMaxUserId(me.studentId()).orElse(null);

        session.setAttribute(PENDING_IDENTIFICATION_KEY, new PendingIdentification(
            me.studentId(),
            me.fullName(),
            email,
            phone,
            maxUserId,
            me.programs()
        ));
        session.removeAttribute(PENDING_KEY);
        session.removeAttribute(SESSION_KEY);

        return toIdentifyResponse(me.studentId(), email, phone, maxUserId);
    }

    /** Deep link для привязки MAX (нужна сессия pending identification). */
    public MaxBindLinkResponse maxBindLink(HttpSession session) {
        PendingIdentification pending = requirePendingIdentification(session);
        MaxBindingService.MaxBindLink link = maxBindingService.createBindLink(pending.studentId());
        return new MaxBindLinkResponse(link.url(), link.expiresInSeconds());
    }

    /** Обновить maxAvailable из БД (после привязки в боте). */
    public IdentifyResponse refreshPendingIdentification(HttpSession session) {
        PendingIdentification pending = requirePendingIdentification(session);
        Long maxUserId = maxBindingService.findMaxUserId(pending.studentId()).orElse(null);
        session.setAttribute(PENDING_IDENTIFICATION_KEY, new PendingIdentification(
            pending.studentId(),
            pending.fullName(),
            pending.email(),
            pending.phone(),
            maxUserId,
            pending.programs()
        ));
        return toIdentifyResponse(pending.studentId(), pending.email(), pending.phone(), maxUserId);
    }

    /** Шаг 2: отправка кода на выбранный канал. */
    public LoginChallengeResponse sendCode(LoginCodeChannel channel, HttpSession session) {
        LoginCodeChannel delivery = channel == null ? LoginCodeChannel.EMAIL : channel;

        PendingIdentification pending = requirePendingIdentification(session);
        Long maxUserId = maxBindingService.findMaxUserId(pending.studentId()).orElse(null);

        String code = generateCode();
        String deliveryHint;

        if (delivery == LoginCodeChannel.MAX) {
            if (!isMaxAvailable(maxUserId)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Сначала привяжите MAX через бота"
                );
            }
            try {
                maxSender.sendLoginCode(maxUserId, pending.fullName(), code);
            } catch (MaxSendException e) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Не удалось отправить код в MAX. Попробуйте email или позже."
                );
            }
            deliveryHint = maskPhone(pending.phone());
        } else {
            try {
                emailSender.sendLoginCode(pending.email(), pending.fullName(), code);
            } catch (EmailSendException e) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Не удалось отправить код входа на email. Попробуйте позже."
                );
            }
            deliveryHint = maskEmail(pending.email());
        }

        session.setAttribute(PENDING_KEY, new PendingChallenge(
            pending.studentId(),
            pending.fullName(),
            pending.email(),
            pending.phone(),
            maxUserId,
            delivery,
            code,
            pending.programs()
        ));
        session.removeAttribute(PENDING_IDENTIFICATION_KEY);

        return new LoginChallengeResponse(
            pending.studentId(),
            pending.email(),
            delivery,
            deliveryHint
        );
    }

    /** Шаг 3: подтверждение кода, создание сессии. */
    public MeResponse verifyCode(String code, HttpSession session) {
        Object raw = session.getAttribute(PENDING_KEY);
        if (!(raw instanceof PendingChallenge pending)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Сначала войдите по номеру зачётки"
            );
        }

        String digits = code == null ? "" : code.replaceAll("\\s", "");
        if (!pending.code().equals(digits)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный код подтверждения");
        }

        StudentSession student = new StudentSession(
            pending.studentId(),
            pending.fullName(),
            pending.email(),
            pending.programs()
        );
        session.setAttribute(SESSION_KEY, student);
        session.removeAttribute(PENDING_KEY);
        session.removeAttribute(PENDING_IDENTIFICATION_KEY);
        scheduleContextService.warmQuietly(session, student);

        return toMeResponse(student);
    }

    public Optional<MeResponse> currentUser(HttpSession session) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            return Optional.empty();
        }
        return Optional.of(toMeResponse(student));
    }

    public Optional<IdentifyResponse> pendingIdentification(HttpSession session) {
        Object raw = session.getAttribute(PENDING_IDENTIFICATION_KEY);
        if (!(raw instanceof PendingIdentification pending)) {
            return Optional.empty();
        }
        Long maxUserId = maxBindingService.findMaxUserId(pending.studentId()).orElse(null);
        return Optional.of(toIdentifyResponse(
            pending.studentId(),
            pending.email(),
            pending.phone(),
            maxUserId
        ));
    }

    public Optional<LoginChallengeResponse> pendingChallenge(HttpSession session) {
        Object raw = session.getAttribute(PENDING_KEY);
        if (!(raw instanceof PendingChallenge pending)) {
            return Optional.empty();
        }
        String deliveryHint = pending.channel() == LoginCodeChannel.MAX
            ? maskPhone(pending.phone())
            : maskEmail(pending.email());
        return Optional.of(new LoginChallengeResponse(
            pending.studentId(),
            pending.email(),
            pending.channel(),
            deliveryHint
        ));
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    private PendingIdentification requirePendingIdentification(HttpSession session) {
        Object raw = session.getAttribute(PENDING_IDENTIFICATION_KEY);
        if (!(raw instanceof PendingIdentification pending)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Сначала укажите номер зачётки"
            );
        }
        return pending;
    }

    private IdentifyResponse toIdentifyResponse(
        String studentId,
        String email,
        String phone,
        Long maxUserId
    ) {
        return new IdentifyResponse(
            studentId,
            maskEmail(email),
            maskPhone(phone),
            true,
            isMaxAvailable(maxUserId)
        );
    }

    private boolean isMaxAvailable(Long maxUserId) {
        return maxBindingService.isLoginChannelEnabled() && maxUserId != null;
    }

    private MeResponse toMeResponse(StudentSession student) {
        return new MeResponse(
            student.studentId(),
            student.fullName(),
            student.email(),
            "",
            student.programs(),
            null
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

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return email;
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "—";
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
            String code = digits.substring(1, 4);
            String tail = digits.substring(digits.length() - 2);
            return "+7 (" + code + ") ***-**-" + tail;
        }
        if (digits.length() >= 4) {
            return "***" + digits.substring(digits.length() - 4);
        }
        return "***";
    }
}
