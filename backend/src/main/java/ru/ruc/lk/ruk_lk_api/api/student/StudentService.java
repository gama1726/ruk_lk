package ru.ruc.lk.ruk_lk_api.api.student;



import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import org.springframework.http.HttpStatus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCOrdersResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleGroupLookupResponse;

import java.time.LocalDate;



@Service

public class StudentService {



    private static final String SESSION_KEY = "STUDENT";
    private static final String SCHEDULE_CONTEXT_KEY = "SCHEDULE_GROUP";

    private final OneCClient onecClient;
    private final ScheduleClient scheduleClient;

    public StudentService(OneCClient onecClient, ScheduleClient scheduleClient) {
        this.onecClient = onecClient;
        this.scheduleClient = scheduleClient;
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

    public ScheduleResponse getSchedule(HttpSession session, LocalDate date) {
        StudentSession student = requireStudent(session);
        LocalDate anchorDate = date != null ? date : LocalDate.now();

        String groupName = onecClient
            .fetchProfile(student.studentId())
            .map(OneCProfileResponse::group)
            .map(String::trim)
            .filter(group -> !group.isBlank())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа студента не найдена"
            ));

        ScheduleSessionContext context = resolveScheduleContext(session, groupName);

        var week = scheduleClient
            .fetchGroupWeek(context.branchGuid(), context.groupGuid(), anchorDate)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Расписание не найдено"
            ));

        return ScheduleMapper.toResponse(groupName, anchorDate, week);
    }

    private ScheduleSessionContext resolveScheduleContext(HttpSession session, String groupName) {
        Object raw = session.getAttribute(SCHEDULE_CONTEXT_KEY);
        if (raw instanceof ScheduleSessionContext cached && groupName.equals(cached.groupName())) {
            return cached;
        }

        ScheduleGroupLookupResponse lookup = scheduleClient
            .lookupGroup(groupName)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа не найдена в сервисе расписания"
            ));

        ScheduleSessionContext context = new ScheduleSessionContext(
            groupName,
            lookup.group().guid().trim(),
            lookup.branch().guid().trim()
        );
        session.setAttribute(SCHEDULE_CONTEXT_KEY, context);
        return context;
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

