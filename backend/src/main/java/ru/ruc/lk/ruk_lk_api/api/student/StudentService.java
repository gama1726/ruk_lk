package ru.ruc.lk.ruk_lk_api.api.student;



import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import org.springframework.http.HttpStatus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCCurriculumResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCOrdersResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleWeekApiResponse;

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

    private final OneCClient onecClient;
    private final ScheduleClient scheduleClient;
    private final ScheduleContextService scheduleContextService;

    public StudentService(
        OneCClient onecClient,
        ScheduleClient scheduleClient,
        ScheduleContextService scheduleContextService
    ) {
        this.onecClient = onecClient;
        this.scheduleClient = scheduleClient;
        this.scheduleContextService = scheduleContextService;
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

        String group = blankToEmpty(profile.group());
        if (!group.isBlank()) {
            scheduleContextService.warmQuietly(session, group);
        }

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

            group,

            blankToEmpty(profile.course())

        );

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

