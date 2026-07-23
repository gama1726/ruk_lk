package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ProgramSummary;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleClient;
import ru.ruc.lk.ruk_lk_api.integration.schedule.ScheduleGroupLookupResponse;

/**
 * Резолв и кэш в HTTP-сессии GUID группы/филиала для сервиса расписания.
 * После логина контекст прогревается заранее — месяц грузится сразу в get_schedule.
 */
@Service
public class ScheduleContextService {

    static final String SESSION_KEY = "SCHEDULE_GROUP";

    private static final Logger log = LoggerFactory.getLogger(ScheduleContextService.class);

    private final ScheduleClient scheduleClient;

    public ScheduleContextService(ScheduleClient scheduleClient) {
        this.scheduleClient = scheduleClient;
    }

    /**
     * Прогрев при логине: не роняет сессию, если сервис расписания недоступен.
     */
    public void warmQuietly(HttpSession session, StudentSession student) {
        groupFromPrograms(student.programs()).ifPresent(group -> warmQuietly(session, group));
    }

    /** Прогрев по известному имени группы (например из профиля 1С). */
    public void warmQuietly(HttpSession session, String groupName) {
        if (groupName == null || groupName.isBlank()) {
            return;
        }
        try {
            resolve(session, groupName.trim());
        } catch (Exception ex) {
            log.warn("Не удалось прогреть контекст расписания для группы {}: {}", groupName, ex.toString());
        }
    }

    public ScheduleSessionContext require(
        HttpSession session,
        StudentSession student,
        Supplier<Optional<String>> groupFromProfile
    ) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (raw instanceof ScheduleSessionContext cached
            && cached.groupGuid() != null && !cached.groupGuid().isBlank()
            && cached.branchGuid() != null && !cached.branchGuid().isBlank()) {
            return cached;
        }

        String groupName = resolveGroupName(session, student, groupFromProfile);
        return resolve(session, groupName);
    }

    public String resolveGroupName(
        HttpSession session,
        StudentSession student,
        Supplier<Optional<String>> groupFromProfile
    ) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (raw instanceof ScheduleSessionContext cached
            && cached.groupName() != null && !cached.groupName().isBlank()) {
            return cached.groupName();
        }

        return groupFromPrograms(student.programs())
            .or(() -> groupFromProfile == null ? Optional.empty() : groupFromProfile.get())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа студента не найдена"
            ));
    }

    private ScheduleSessionContext resolve(HttpSession session, String groupName) {
        synchronized (lock(session)) {
            Object raw = session.getAttribute(SESSION_KEY);
            if (raw instanceof ScheduleSessionContext cached
                && groupName.equals(cached.groupName())
                && cached.groupGuid() != null && !cached.groupGuid().isBlank()
                && cached.branchGuid() != null && !cached.branchGuid().isBlank()) {
                return cached;
            }

            ScheduleGroupLookupResponse lookup = scheduleClient
                .lookupGroup(groupName)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Группа не найдена в сервисе расписания"
                ));

            if (lookup.group() == null || lookup.branch() == null
                || isBlank(lookup.group().guid()) || isBlank(lookup.branch().guid())) {
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Группа не найдена в сервисе расписания"
                );
            }

            ScheduleSessionContext context = new ScheduleSessionContext(
                groupName,
                lookup.group().guid().trim(),
                lookup.branch().guid().trim()
            );
            session.setAttribute(SESSION_KEY, context);
            return context;
        }
    }

    private static Optional<String> groupFromPrograms(List<ProgramSummary> programs) {
        if (programs == null) {
            return Optional.empty();
        }
        for (ProgramSummary program : programs) {
            if (program != null && program.group() != null && !program.group().isBlank()) {
                return Optional.of(program.group().trim());
            }
        }
        return Optional.empty();
    }

    private static Object lock(HttpSession session) {
        return ("SCHEDULE_CTX:" + session.getId()).intern();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
