package ru.ruc.lk.ruk_lk_api.api.student;



import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ConfirmEmailChangeRequest;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RequestEmailChangeResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentLibraryResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentNewsResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.UpdateEmailResponse;
import ru.ruc.lk.ruk_lk_api.integration.email.EmailSendException;
import ru.ruc.lk.ruk_lk_api.integration.email.VerificationEmailSender;
import ru.ruc.lk.ruk_lk_api.integration.megaapi.MegaApiClient;
import ru.ruc.lk.ruk_lk_api.integration.megaapi.MegaBookItem;
import ru.ruc.lk.ruk_lk_api.integration.megaapi.MegaReaderRecord;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.rucnews.RucNewsClient;
import ru.ruc.lk.ruk_lk_api.integration.rucnews.RucNewsItem;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import org.springframework.http.HttpStatus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCOrdersResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileEmailResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;



@Service

public class StudentService {



    private static final String SESSION_KEY = "STUDENT";
    private static final String PENDING_EMAIL_CHANGE_KEY = "PENDING_EMAIL_CHANGE";
    private static final String EMAIL_CHANGE_LAST_SEND_AT_KEY = "EMAIL_CHANGE_LAST_CODE_SENT_AT";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final java.util.regex.Pattern EMAIL_PATTERN =
        java.util.regex.Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final OneCClient onecClient;
    private final ScheduleClient scheduleClient;
    private final ScheduleContextService scheduleContextService;
    private final MegaApiClient megaApiClient;
    private final RucNewsClient rucNewsClient;
    private final VerificationEmailSender emailSender;
    private final String fixedCode;
    private final Duration otpTtl;
    private final int otpMaxAttempts;
    private final Duration sendCooldown;

    public StudentService(
        OneCClient onecClient,
        ScheduleClient scheduleClient,
        ScheduleContextService scheduleContextService,
        MegaApiClient megaApiClient,
        RucNewsClient rucNewsClient,
        VerificationEmailSender emailSender,
        @Value("${app.auth.fixed-code:}") String fixedCode,
        @Value("${app.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
        @Value("${app.auth.otp-max-attempts:5}") int otpMaxAttempts,
        @Value("${app.auth.send-code-cooldown-seconds:60}") long sendCooldownSeconds
    ) {
        this.onecClient = onecClient;
        this.scheduleClient = scheduleClient;
        this.scheduleContextService = scheduleContextService;
        this.megaApiClient = megaApiClient;
        this.rucNewsClient = rucNewsClient;
        this.emailSender = emailSender;
        this.fixedCode = fixedCode;
        this.otpTtl = Duration.ofSeconds(Math.max(60, otpTtlSeconds));
        this.otpMaxAttempts = Math.max(1, otpMaxAttempts);
        this.sendCooldown = Duration.ofSeconds(Math.max(0, sendCooldownSeconds));
    }



    public StudentProfileResponse getProfile(HttpSession session) {

        StudentSession student = requireStudent(session);



        OneCProfileResponse profile = onecClient

            .fetchProfile(student.studentId())

            .orElseThrow(() -> new ResponseStatusException(

                HttpStatus.NOT_FOUND,

                "Профиль студента не найден"

            ));



        String zachetka = profile.zachetka() != null && !profile.zachetka().isBlank()

            ? profile.zachetka().trim()

            : profile.studentId();



        return new StudentProfileResponse(

            blankToEmpty(profile.fullName()),

            blankToEmpty(zachetka),

            blankToEmpty(profile.email()),

            blankToEmpty(profile.phone()),

            blankToEmpty(profile.gender()),

            blankToEmpty(profile.birthDate()),

            blankToEmpty(profile.fundingType()),

            blankToEmpty(profile.status()),

            blankToEmpty(profile.faculty()),

            blankToEmpty(profile.department()),

            formatDirection(profile.direction(), profile.specialization()),

            blankToEmpty(profile.level()),

            blankToEmpty(profile.educationForm()),

            blankToEmpty(profile.group()),

            blankToEmpty(profile.course())

        );

    }

    /**
     * Шаг 1: отправить код подтверждения на новую почту (ещё без записи в 1С).
     */
    public RequestEmailChangeResponse requestEmailChange(HttpSession session, String rawEmail) {
        StudentSession student = requireStudent(session);
        String email = normalizeEmail(rawEmail);

        String current = blankToEmpty(student.email());
        if (!current.isEmpty() && current.equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Это уже ваша текущая почта");
        }

        enforceEmailChangeSendCooldown(session);

        String code = generateCode();
        try {
            emailSender.sendEmailChangeCode(email, student.fullName(), code);
        } catch (EmailSendException e) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Не удалось отправить код на новую почту. Попробуйте позже."
            );
        }

        Instant now = Instant.now();
        session.setAttribute(PENDING_EMAIL_CHANGE_KEY, new PendingEmailChange(email, code, now, 0));
        session.setAttribute(EMAIL_CHANGE_LAST_SEND_AT_KEY, now);

        String masked = maskEmail(email);
        return new RequestEmailChangeResponse(
            masked,
            "Код отправлен на " + masked + ". Введите его для подтверждения смены почты.",
            (int) otpTtl.toSeconds()
        );
    }

    /**
     * Шаг 2: проверить код и сменить почту в 1С.
     */
    public UpdateEmailResponse confirmEmailChange(HttpSession session, ConfirmEmailChangeRequest body) {
        StudentSession student = requireStudent(session);

        Object raw = session.getAttribute(PENDING_EMAIL_CHANGE_KEY);
        if (!(raw instanceof PendingEmailChange pending)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Сначала запросите код на новую почту"
            );
        }

        if (pending.createdAt() == null || Instant.now().isAfter(pending.createdAt().plus(otpTtl))) {
            session.removeAttribute(PENDING_EMAIL_CHANGE_KEY);
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Код истёк. Запросите новый код"
            );
        }

        if (pending.failedAttempts() >= otpMaxAttempts) {
            session.removeAttribute(PENDING_EMAIL_CHANGE_KEY);
            throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Слишком много неверных попыток. Запросите новый код"
            );
        }

        String digits = body == null || body.code() == null ? "" : body.code().replaceAll("\\s", "");
        if (!pending.code().equals(digits)) {
            int next = pending.failedAttempts() + 1;
            if (next >= otpMaxAttempts) {
                session.removeAttribute(PENDING_EMAIL_CHANGE_KEY);
                throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Слишком много неверных попыток. Запросите новый код"
                );
            }
            session.setAttribute(PENDING_EMAIL_CHANGE_KEY, pending.withFailedAttempts(next));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный код подтверждения");
        }

        session.removeAttribute(PENDING_EMAIL_CHANGE_KEY);
        return applyEmailChange(session, student, pending.newEmail());
    }

    private UpdateEmailResponse applyEmailChange(HttpSession session, StudentSession student, String email) {
        OneCProfileEmailResponse result = onecClient
            .updateProfileEmail(student.studentId(), email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось изменить почту"
            ));

        if (!result.success()) {
            String message = result.message() != null && !result.message().isBlank()
                ? result.message().trim()
                : "Не удалось изменить почту";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        String newEmail = blankToEmpty(result.email());
        if (newEmail.isEmpty()) {
            newEmail = email;
        }

        session.setAttribute(
            SESSION_KEY,
            new StudentSession(student.studentId(), student.fullName(), newEmail, student.programs())
        );

        return new UpdateEmailResponse(
            newEmail,
            blankToEmpty(result.oldEmail()),
            blankToEmpty(result.message()).isEmpty() ? "Почта обновлена" : result.message().trim()
        );
    }

    private void enforceEmailChangeSendCooldown(HttpSession session) {
        if (sendCooldown.isZero() || sendCooldown.isNegative()) {
            return;
        }
        Object raw = session.getAttribute(EMAIL_CHANGE_LAST_SEND_AT_KEY);
        if (!(raw instanceof Instant lastSent)) {
            return;
        }
        Instant allowedAt = lastSent.plus(sendCooldown);
        if (Instant.now().isBefore(allowedAt)) {
            long retryAfter = Duration.between(Instant.now(), allowedAt).toSeconds();
            throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Подождите " + Math.max(1, retryAfter) + " с. перед повторной отправкой кода"
            );
        }
    }

    private String generateCode() {
        if (fixedCode != null && !fixedCode.isBlank()) {
            return fixedCode.trim();
        }
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return email;
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private static String normalizeEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите почту");
        }
        String email = rawEmail.trim();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Похоже, почта указана с ошибкой");
        }
        if (email.length() > 320) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Слишком длинный адрес почты");
        }
        return email;
    }

    public RecordBookResponse getRecordBook(HttpSession session) {
        StudentSession student = requireStudent(session);

        OneCGradebookResponse gradebook = onecClient
            .fetchGradebook(student.studentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Зачётная книжка не найдена"
            ));

        return GradebookMapper.toResponse(gradebook);
    }

    public StudentOrdersResponse getOrders(HttpSession session) {
        StudentSession student = requireStudent(session);

        OneCOrdersResponse orders = onecClient
            .fetchOrders(student.studentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Приказы не найдены"
            ));

        return OrdersMapper.toResponse(orders);
    }

    public StudentPortfolioResponse getPortfolio(HttpSession session) {
        StudentSession student = requireStudent(session);

        OneCPortfolioResponse portfolio = onecClient
            .fetchPortfolio(student.studentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Портфолио студента не найдено"
            ));

        return PortfolioMapper.toResponse(portfolio);
    }

    public StudentCurriculumResponse getCurriculum(HttpSession session) {
        StudentSession student = requireStudent(session);

        OneCCurriculumResponse curriculum = onecClient
            .fetchCurriculum(student.studentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Учебный план не найден"
            ));

        return CurriculumMapper.toResponse(curriculum);
    }

    public StudentPaymentsResponse getPayments(HttpSession session, LocalDate date) {
        StudentSession student = requireStudent(session);
        LocalDate asOf = date != null ? date : LocalDate.now();

        OneCPaymentsResponse payments = onecClient
            .fetchPayments(student.studentId(), asOf, true)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Данные об оплате не найдены"
            ));

        return PaymentsMapper.toResponse(payments, asOf);
    }

    /**
     * Новости университета с new.ruc.su/blog (HTML-парсинг + кэш).
     */
    public StudentNewsResponse getNews(HttpSession session) {
        requireStudent(session);
        if (!rucNewsClient.isEnabled()) {
            return new StudentNewsResponse("unavailable", List.of());
        }
        List<RucNewsItem> items = rucNewsClient.fetchLatest();
        if (items.isEmpty() && !rucNewsClient.lastFetchOk()) {
            return new StudentNewsResponse("unavailable", List.of());
        }
        List<StudentNewsResponse.StudentNewsItemResponse> mapped = items.stream()
            .map(item -> new StudentNewsResponse.StudentNewsItemResponse(
                blankToEmpty(item.id()),
                blankToEmpty(item.title()),
                blankToEmpty(item.preview()),
                blankToEmpty(item.date()),
                blankToEmpty(item.url()),
                blankToEmpty(item.imageUrl())
            ))
            .toList();
        return new StudentNewsResponse("ok", mapped);
    }

    /**
     * Читательский билет и книги из МегаAPI.
     * {@code rdr_id} = номер зачётки из сессии.
     */
    public StudentLibraryResponse getLibrary(HttpSession session) {
        StudentSession student = requireStudent(session);
        String rdrId = student.studentId();

        if (!megaApiClient.isEnabled()) {
            return LibraryMapper.unavailable(rdrId);
        }

        Optional<MegaReaderRecord> reader = megaApiClient.getReader(rdrId);
        List<MegaBookItem> onHand = megaApiClient.getHandBooks(rdrId);
        List<MegaBookItem> debts = megaApiClient.getDebtBooks(rdrId);
        List<MegaBookItem> orders = megaApiClient.getOrderBooks(rdrId);

        return LibraryMapper.toResponse(
            rdrId,
            reader.orElse(null),
            onHand,
            debts,
            orders
        );
    }

    public ScheduleResponse getSchedule(HttpSession session, LocalDate date) {
        StudentSession student = requireStudent(session);
        LocalDate anchorDate = date != null ? date : LocalDate.now();

        ScheduleSessionContext context = scheduleContext(session, student);

        var week = scheduleClient
            .fetchGroupWeek(context.branchGuid(), context.groupGuid(), anchorDate)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Расписание не найдено"
            ));

        return ScheduleMapper.toResponse(context.groupName(), anchorDate, week);
    }

    /**
     * Месяц целиком: GUID уже в сессии после логина → сразу параллельные get_schedule.
     * @param month месяц 1..12
     */
    public ScheduleMonthResponse getScheduleMonth(HttpSession session, int year, int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Месяц должен быть от 1 до 12");
        }
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректный год");
        }

        StudentSession student = requireStudent(session);
        ScheduleSessionContext context = scheduleContext(session, student);

        List<LocalDate> anchors = ScheduleMapper.weekAnchorsForMonth(year, month);
        List<ScheduleWeekApiResponse> weeks = fetchWeeksParallel(context, anchors);

        return ScheduleMapper.toMonthResponse(context.groupName(), year, month, weeks);
    }

    private ScheduleSessionContext scheduleContext(HttpSession session, StudentSession student) {
        return scheduleContextService.require(
            session,
            student,
            () -> onecClient
                .fetchProfile(student.studentId())
                .map(OneCProfileResponse::group)
                .map(String::trim)
                .filter(group -> !group.isBlank())
        );
    }

    private List<ScheduleWeekApiResponse> fetchWeeksParallel(
        ScheduleSessionContext context,
        List<LocalDate> anchors
    ) {
        if (anchors.isEmpty()) {
            return List.of();
        }
        if (anchors.size() == 1) {
            return scheduleClient
                .fetchGroupWeek(context.branchGuid(), context.groupGuid(), anchors.get(0))
                .map(List::of)
                .orElse(List.of());
        }

        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(anchors.size(), 6))) {
            List<CompletableFuture<ScheduleWeekApiResponse>> futures = new ArrayList<>(anchors.size());
            for (LocalDate anchor : anchors) {
                futures.add(CompletableFuture.supplyAsync(
                    () -> scheduleClient
                        .fetchGroupWeek(context.branchGuid(), context.groupGuid(), anchor)
                        .orElse(null),
                    pool
                ));
            }
            List<ScheduleWeekApiResponse> weeks = new ArrayList<>(anchors.size());
            for (CompletableFuture<ScheduleWeekApiResponse> future : futures) {
                ScheduleWeekApiResponse week = future.join();
                if (week != null) {
                    weeks.add(week);
                }
            }
            return weeks;
        }
    }

    private static String formatDirection(String direction, String specialization) {

        String d = direction == null ? "" : direction.trim();

        String s = specialization == null ? "" : specialization.trim();

        if (!d.isEmpty() && !s.isEmpty()) {

            return d + " (" + s + ")";

        }

        if (!d.isEmpty()) {

            return d;

        }

        return s;

    }



    private static String blankToEmpty(String value) {

        return value == null || value.isBlank() ? "" : value.trim();

    }



    private StudentSession requireStudent(HttpSession session) {

        Object raw = session.getAttribute(SESSION_KEY);

        if (!(raw instanceof StudentSession student)) {

            throw new ResponseStatusException(

                HttpStatus.UNAUTHORIZED,

                "Сначала войдите в систему"

            );

        }

        return student;

    }

}

