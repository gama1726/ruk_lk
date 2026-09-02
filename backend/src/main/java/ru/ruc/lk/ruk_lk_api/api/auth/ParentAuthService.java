package ru.ruc.lk.ruk_lk_api.api.auth;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MaxBindLinkResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentDeliveryOptionsDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentFamilyResponseDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentLoginChallengeDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentMeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentMemberOptionDto;
import ru.ruc.lk.ruk_lk_api.integration.email.EmailSendException;
import ru.ruc.lk.ruk_lk_api.integration.email.VerificationEmailSender;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxBindingService;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxSendException;
import ru.ruc.lk.ruk_lk_api.integration.max.VerificationMaxSender;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCFamilyResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;
import ru.ruc.lk.ruk_lk_api.api.student.ScheduleContextService;

@Service
public class ParentAuthService {

    public static final String SESSION_KEY = "PARENT";
    public static final String CONSENT_REQUIRED_MESSAGE =
        "Ребёнку необходимо подписать согласие на предоставление данных третьим лицам";

    private static final Logger log = LoggerFactory.getLogger(ParentAuthService.class);
    private static final String PENDING_FAMILY_KEY = "PENDING_PARENT_FAMILY";
    private static final String PENDING_MEMBER_KEY = "PENDING_PARENT_MEMBER";
    private static final String PENDING_CHALLENGE_KEY = "PENDING_PARENT_CHALLENGE";
    private static final String LAST_SEND_AT_KEY = "PARENT_AUTH_LAST_CODE_SENT_AT";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PARENT_IDENTIFY_FAILED =
        "Родители для указанной зачётки не найдены. Проверьте номер или обратитесь в деканат.";

    private final OneCClient onecClient;
    private final VerificationEmailSender emailSender;
    private final VerificationMaxSender maxSender;
    private final MaxBindingService maxBindingService;
    private final String fixedCode;
    private final Duration otpTtl;
    private final int otpMaxAttempts;
    private final Duration sendCooldown;

    public ParentAuthService(
        OneCClient onecClient,
        VerificationEmailSender emailSender,
        VerificationMaxSender maxSender,
        MaxBindingService maxBindingService,
        @Value("${app.auth.fixed-code:}") String fixedCode,
        @Value("${app.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
        @Value("${app.auth.otp-max-attempts:5}") int otpMaxAttempts,
        @Value("${app.auth.send-code-cooldown-seconds:60}") long sendCooldownSeconds
    ) {
        this.onecClient = onecClient;
        this.emailSender = emailSender;
        this.maxSender = maxSender;
        this.maxBindingService = maxBindingService;
        this.fixedCode = fixedCode;
        this.otpTtl = Duration.ofSeconds(Math.max(60, otpTtlSeconds));
        this.otpMaxAttempts = Math.max(1, otpMaxAttempts);
        this.sendCooldown = Duration.ofSeconds(Math.max(0, sendCooldownSeconds));
    }

    public ParentFamilyResponseDto identify(String studentId, HttpSession session) {
        String id = normalizeStudentId(studentId);

        clearStudentSession(session);
        session.removeAttribute(PENDING_CHALLENGE_KEY);
        session.removeAttribute(PENDING_MEMBER_KEY);
        session.removeAttribute(PENDING_FAMILY_KEY);

        OneCFamilyResponse family = onecClient.checkParent(id, null)
            .orElseThrow(() -> unauthorizedIdentify());

        if (!family.parentsFound() || family.parents() == null || family.parents().isEmpty()) {
            throw unauthorizedIdentify();
        }

        PendingParentFamily pendingFamily = new PendingParentFamily(
            family.studentId(),
            family.studentFullName(),
            family.studentAdult(),
            family.parents()
        );
        session.setAttribute(PENDING_FAMILY_KEY, pendingFamily);
        return toFamilyResponse(pendingFamily);
    }

    public ParentDeliveryOptionsDto selectMember(int memberIndex, HttpSession session) {
        PendingParentFamily family = requirePendingFamily(session);
        if (memberIndex < 0 || memberIndex >= family.parents().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректный выбор родителя");
        }

        OneCParentMember parent = family.parents().get(memberIndex);
        PendingParentMember pendingMember = toPendingMember(family, memberIndex, parent);
        session.setAttribute(PENDING_MEMBER_KEY, pendingMember);
        session.removeAttribute(PENDING_CHALLENGE_KEY);
        return toDeliveryOptions(pendingMember);
    }

    public MaxBindLinkResponse maxBindLink(HttpSession session) {
        PendingParentMember member = requirePendingMember(session);
        String phone = member.phone();
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "В базе нет телефона для входа через MAX. Обратитесь в деканат или войдите через email."
            );
        }
        MaxBindingService.MaxBindLink link = maxBindingService.createBindLink(bindingKey(member), phone);
        return new MaxBindLinkResponse(link.url(), link.expiresInSeconds());
    }

    public ParentDeliveryOptionsDto refreshDelivery(HttpSession session) {
        return toDeliveryOptions(requirePendingMember(session));
    }

    public ParentLoginChallengeDto sendCode(LoginCodeChannel channel, HttpSession session) {
        LoginCodeChannel delivery = channel == null ? LoginCodeChannel.EMAIL : channel;
        enforceSendCooldown(session);
        PendingParentMember member = requirePendingMember(session);

        String email = member.email();
        String phone = member.phone();
        Long maxUserId = null;

        if (delivery == LoginCodeChannel.MAX) {
            if (phone == null || phone.isBlank()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "В базе нет телефона для входа через MAX. Обратитесь в деканат или войдите через email."
                );
            }
            MaxBindingService.BindingResolution binding =
                maxBindingService.resolveBindingForLogin(bindingKey(member), phone);
            if (binding.phoneChanged()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Номер телефона в базе университета изменился. Привяжите MAX заново, чтобы получать коды входа."
                );
            }
            maxUserId = binding.maxUserId().orElse(null);
            if (maxUserId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сначала привяжите MAX через бота");
            }
        } else if (email == null || email.isBlank()) {
            if (!hasFixedCodeFallback(email, phone)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email не указан в базе университета. Войдите через MAX или обратитесь в деканат."
                );
            }
            log.warn(
                "Parent login без email и MAX: studentId={}, relation={} — используется fixed-code",
                member.studentId(),
                member.relation()
            );
        }

        String code = generateCode();
        String deliveryHint;

        if (delivery == LoginCodeChannel.MAX) {
            try {
                maxSender.sendLoginCode(maxUserId, maxLoginRecipientName(member), code);
            } catch (MaxSendException e) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Не удалось отправить код в MAX. Попробуйте email или позже."
                );
            }
            deliveryHint = maskPhone(phone);
        } else if (email != null && !email.isBlank()) {
            try {
                emailSender.sendLoginCode(email, "родитель", code);
            } catch (EmailSendException e) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Не удалось отправить код на email. Попробуйте позже."
                );
            }
            deliveryHint = maskEmail(email);
        } else {
            deliveryHint = "тестовый вход";
        }

        session.setAttribute(PENDING_CHALLENGE_KEY, new PendingParentChallenge(
            member,
            delivery,
            maxUserId,
            code,
            Instant.now(),
            0
        ));
        session.setAttribute(LAST_SEND_AT_KEY, Instant.now());
        session.removeAttribute(PENDING_FAMILY_KEY);

        return new ParentLoginChallengeDto(deliveryHint, delivery.name());
    }

    public ParentMeResponse verifyCode(String code, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала пройдите вход для родителя");
        }

        Object raw = session.getAttribute(PENDING_CHALLENGE_KEY);
        if (!(raw instanceof PendingParentChallenge pending)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала запросите код входа");
        }

        if (pending.createdAt() == null || Instant.now().isAfter(pending.createdAt().plus(otpTtl))) {
            session.removeAttribute(PENDING_CHALLENGE_KEY);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Код истёк. Запросите новый код входа");
        }

        if (pending.failedAttempts() >= otpMaxAttempts) {
            session.removeAttribute(PENDING_CHALLENGE_KEY);
            throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Слишком много неверных попыток. Запросите новый код"
            );
        }

        String digits = code == null ? "" : code.replaceAll("\\s", "");
        if (!pending.code().equals(digits)) {
            int next = pending.failedAttempts() + 1;
            if (next >= otpMaxAttempts) {
                session.removeAttribute(PENDING_CHALLENGE_KEY);
                throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Слишком много неверных попыток. Запросите новый код"
                );
            }
            session.setAttribute(PENDING_CHALLENGE_KEY, pending.withFailedAttempts(next));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный код подтверждения");
        }

        PendingParentMember member = pending.member();
        ParentSession parentSession = new ParentSession(
            member.studentId(),
            member.studentFullName(),
            member.studentAdult(),
            member.memberIndex(),
            member.relation(),
            member.parentFullName(),
            member.isCustomer(),
            member.servicesBlocked(),
            member.email(),
            member.phone()
        );

        clearStudentSession(session);
        session.removeAttribute(PENDING_CHALLENGE_KEY);
        session.removeAttribute(PENDING_MEMBER_KEY);
        session.removeAttribute(PENDING_FAMILY_KEY);
        session.removeAttribute(LAST_SEND_AT_KEY);
        session.removeAttribute(ScheduleContextService.SESSION_KEY);
        session.setAttribute(SESSION_KEY, parentSession);
        request.changeSessionId();

        return toMeResponse(parentSession);
    }

    public Optional<ParentMeResponse> currentUser(HttpSession session) {
        if (session == null) {
            return Optional.empty();
        }
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof ParentSession parent)) {
            return Optional.empty();
        }
        return Optional.of(toMeResponse(parent));
    }

    public Optional<ParentFamilyResponseDto> pendingFamily(HttpSession session) {
        return optionalPendingFamily(session).map(this::toFamilyResponse);
    }

    public Optional<ParentDeliveryOptionsDto> pendingDelivery(HttpSession session) {
        if (session == null) {
            return Optional.empty();
        }
        Object raw = session.getAttribute(PENDING_MEMBER_KEY);
        if (!(raw instanceof PendingParentMember member)) {
            return Optional.empty();
        }
        if (session.getAttribute(PENDING_CHALLENGE_KEY) instanceof PendingParentChallenge) {
            return Optional.empty();
        }
        return Optional.of(toDeliveryOptions(member));
    }

    public Optional<ParentLoginChallengeDto> pendingChallenge(HttpSession session) {
        if (session == null) {
            return Optional.empty();
        }
        Object raw = session.getAttribute(PENDING_CHALLENGE_KEY);
        if (!(raw instanceof PendingParentChallenge pending)) {
            return Optional.empty();
        }
        String hint = challengeHint(pending);
        return Optional.of(new ParentLoginChallengeDto(hint, pending.channel().name()));
    }

    public void logout(HttpSession session) {
        if (session == null) {
            return;
        }
        session.removeAttribute(SESSION_KEY);
        session.removeAttribute(PENDING_FAMILY_KEY);
        session.removeAttribute(PENDING_MEMBER_KEY);
        session.removeAttribute(PENDING_CHALLENGE_KEY);
        session.removeAttribute(LAST_SEND_AT_KEY);
        session.removeAttribute(ScheduleContextService.SESSION_KEY);
    }

    public static ParentSession requireParent(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Необходимо войти в систему");
        }
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof ParentSession parent)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Необходимо войти в систему");
        }
        return parent;
    }

    public static void requireDataAccess(ParentSession parent) {
        if (parent != null && parent.servicesBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, CONSENT_REQUIRED_MESSAGE);
        }
    }

    private ParentFamilyResponseDto toFamilyResponse(PendingParentFamily family) {
        List<ParentMemberOptionDto> members = new ArrayList<>();
        for (int i = 0; i < family.parents().size(); i++) {
            members.add(toMemberOption(i, family.parents().get(i)));
        }
        return new ParentFamilyResponseDto(members);
    }

    private ParentMemberOptionDto toMemberOption(int index, OneCParentMember parent) {
        String email = blankToNull(parent.email());
        String phone = firstPhone(parent.phones());
        return new ParentMemberOptionDto(index, relationKind(parent.relation()), hasLoginChannel(email, phone));
    }

    private ParentDeliveryOptionsDto toDeliveryOptions(PendingParentMember member) {
        String email = member.email();
        String phone = member.phone();
        boolean emailAvailable = email != null && !email.isBlank();
        boolean maxEnabled = maxBindingService.isLoginChannelEnabled();
        boolean maxPhoneChanged = false;
        boolean maxAvailable = false;

        if (maxEnabled && phone != null && !phone.isBlank()) {
            MaxBindingService.BindingResolution binding =
                maxBindingService.resolveBindingForLogin(bindingKey(member), phone);
            maxPhoneChanged = binding.phoneChanged();
            maxAvailable = !maxPhoneChanged && binding.maxUserId().isPresent();
        }

        boolean canSendCode = emailAvailable
            || (maxEnabled && phone != null && !phone.isBlank())
            || hasFixedCodeFallback(email, phone);

        return new ParentDeliveryOptionsDto(
            emailAvailable,
            maxAvailable,
            maxPhoneChanged,
            emailAvailable ? maskEmail(email) : null,
            phone != null && !phone.isBlank() ? maskPhone(phone) : null,
            canSendCode
        );
    }

    private PendingParentMember toPendingMember(
        PendingParentFamily family,
        int memberIndex,
        OneCParentMember parent
    ) {
        return new PendingParentMember(
            family.studentId(),
            family.studentFullName(),
            family.studentAdult(),
            memberIndex,
            blankToEmpty(parent.relation()),
            blankToEmpty(parent.fullName()),
            blankToNull(parent.email()),
            firstPhone(parent.phones()),
            parent.isCustomer(),
            parent.servicesBlocked()
        );
    }

    private ParentMeResponse toMeResponse(ParentSession parent) {
        return new ParentMeResponse(
            parent.studentId(),
            parent.studentFullName(),
            parent.studentAdult(),
            parent.relation(),
            parent.parentFullName(),
            parent.isCustomer(),
            parent.servicesBlocked(),
            parent.dataAccessAllowed(),
            parent.servicesBlocked() ? CONSENT_REQUIRED_MESSAGE : null
        );
    }

    private String challengeHint(PendingParentChallenge pending) {
        if (pending.channel() == LoginCodeChannel.MAX) {
            return maskPhone(pending.member().phone());
        }
        String email = pending.member().email();
        if (email != null && !email.isBlank()) {
            return maskEmail(email);
        }
        return "тестовый вход";
    }

    private PendingParentFamily requirePendingFamily(HttpSession session) {
        return optionalPendingFamily(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Сначала укажите номер зачётки ребёнка"
            ));
    }

    private Optional<PendingParentFamily> optionalPendingFamily(HttpSession session) {
        if (session == null) {
            return Optional.empty();
        }
        Object raw = session.getAttribute(PENDING_FAMILY_KEY);
        if (raw instanceof PendingParentFamily family) {
            return Optional.of(family);
        }
        return Optional.empty();
    }

    private PendingParentMember requirePendingMember(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала выберите родителя");
        }
        Object raw = session.getAttribute(PENDING_MEMBER_KEY);
        if (raw instanceof PendingParentMember member) {
            return member;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала выберите родителя");
    }

    private static String bindingKey(PendingParentMember member) {
        return MaxBindingService.parentBindingKey(member.studentId(), member.memberIndex());
    }

    private boolean hasLoginChannel(String email, String phone) {
        if (email != null && !email.isBlank()) {
            return true;
        }
        if (phone != null && !phone.isBlank()) {
            return true;
        }
        return hasFixedCodeFallback(email, phone);
    }

    private boolean hasFixedCodeFallback(String email, String phone) {
        if (fixedCode == null || fixedCode.isBlank()) {
            return false;
        }
        return (email == null || email.isBlank()) && (phone == null || phone.isBlank());
    }

    private void clearStudentSession(HttpSession session) {
        session.removeAttribute("STUDENT");
        session.removeAttribute("PENDING_IDENTIFICATION");
        session.removeAttribute("PENDING_CHALLENGE");
        session.removeAttribute(ScheduleContextService.SESSION_KEY);
    }

    private void enforceSendCooldown(HttpSession session) {
        if (sendCooldown.isZero()) {
            return;
        }
        Object raw = session.getAttribute(LAST_SEND_AT_KEY);
        if (raw instanceof Instant last && Instant.now().isBefore(last.plus(sendCooldown))) {
            throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Подождите перед повторной отправкой кода"
            );
        }
    }

    private String generateCode() {
        if (fixedCode != null && !fixedCode.isBlank()) {
            return fixedCode.trim();
        }
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static ResponseStatusException unauthorizedIdentify() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, PARENT_IDENTIFY_FAILED);
    }

    private static String normalizeStudentId(String studentId) {
        if (studentId == null || studentId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите номер зачётки");
        }
        return studentId.trim();
    }

    private static String firstPhone(List<String> phones) {
        if (phones == null) {
            return null;
        }
        for (String phone : phones) {
            if (phone != null && !phone.isBlank()) {
                return phone.trim();
            }
        }
        return null;
    }

    /** Имя в сообщении MAX после привязки номера в боте. */
    private static String maxLoginRecipientName(PendingParentMember member) {
        String name = member.parentFullName();
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return "родитель";
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String relationKind(String relation) {
        if (relation == null || relation.isBlank()) {
            return "guardian";
        }
        String normalized = relation.trim().toLowerCase();
        if (normalized.contains("мать") || normalized.contains("мama")) {
            return "mother";
        }
        if (normalized.contains("отец") || normalized.contains("отца") || normalized.contains("пapa")) {
            return "father";
        }
        return "guardian";
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 0) {
            return "***";
        }
        String local = email.substring(0, at);
        String domain = email.substring(at + 1);
        if (local.length() <= 2) {
            return local.charAt(0) + "***@" + domain;
        }
        return local.charAt(0) + "***" + local.substring(local.length() - 1) + "@" + domain;
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
