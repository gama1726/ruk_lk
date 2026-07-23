package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.Instant;
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
 * GUID группы/филиала: БД + кэш в HTTP-сессии.
 * Lookup в сервис расписания только если в БД нет записи или сменилась группа.
 */
@Service
public class ScheduleContextService {

    static final String SESSION_KEY = "SCHEDULE_GROUP";

    private static final Logger log = LoggerFactory.getLogger(ScheduleContextService.class);

    private final ScheduleClient scheduleClient;
    private final StudentScheduleContextRepository repository;

    public ScheduleContextService(
        ScheduleClient scheduleClient,
        StudentScheduleContextRepository repository
    ) {
        this.scheduleClient = scheduleClient;
        this.repository = repository;
    }

    /** Прогрев при логине: не роняет сессию при ошибке lookup. */
    public void warmQuietly(HttpSession session, StudentSession student) {
        groupFromPrograms(student.programs()).ifPresent(group ->
            warmQuietly(session, student.studentId(), group)
        );
    }

    public void warmQuietly(HttpSession session, String studentId, String groupName) {
        if (studentId == null || studentId.isBlank() || groupName == null || groupName.isBlank()) {
            return;
        }
        try {
            resolve(session, studentId.trim(), groupName.trim());
        } catch (Exception ex) {
            log.warn(
                "Не удалось прогреть контекст расписания для {} / {}: {}",
                studentId,
                groupName,
                ex.toString()
            );
        }
    }

    public ScheduleSessionContext require(
        HttpSession session,
        StudentSession student,
        Supplier<Optional<String>> groupFromProfile
    ) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (raw instanceof ScheduleSessionContext cached && hasGuids(cached)) {
            String desired = currentGroupName(student, groupFromProfile).orElse(cached.groupName());
            if (desired.equals(cached.groupName())) {
                return cached;
            }
        }

        String groupName = currentGroupName(student, groupFromProfile)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа студента не найдена"
            ));

        return resolve(session, student.studentId(), groupName);
    }

    public String resolveGroupName(
        HttpSession session,
        StudentSession student,
        Supplier<Optional<String>> groupFromProfile
    ) {
        return currentGroupName(student, groupFromProfile)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Группа студента не найдена"
            ));
    }

    /** Актуальная группа: программы сессии → профиль 1С → сохранённая в БД. */
    private Optional<String> currentGroupName(
        StudentSession student,
        Supplier<Optional<String>> groupFromProfile
    ) {
        return groupFromPrograms(student.programs())
            .or(() -> groupFromProfile == null ? Optional.empty() : groupFromProfile.get())
            .or(() -> repository.findById(student.studentId())
                .map(StudentScheduleContext::getGroupName)
                .filter(name -> name != null && !name.isBlank()));
    }

    ScheduleSessionContext resolve(HttpSession session, String studentId, String groupName) {
        synchronized (lock(session)) {
            Object raw = session.getAttribute(SESSION_KEY);
            if (raw instanceof ScheduleSessionContext cached
                && groupName.equals(cached.groupName())
                && hasGuids(cached)) {
                return cached;
            }

            Optional<StudentScheduleContext> stored = repository.findById(studentId);
            if (stored.isPresent()
                && groupName.equals(stored.get().getGroupName())
                && hasGuids(stored.get())) {
                ScheduleSessionContext context = stored.get().toSessionContext();
                session.setAttribute(SESSION_KEY, context);
                return context;
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

            String groupGuid = lookup.group().guid().trim();
            String branchGuid = lookup.branch().guid().trim();
            Instant now = Instant.now();

            StudentScheduleContext row = stored.orElseGet(() ->
                new StudentScheduleContext(studentId, groupName, groupGuid, branchGuid, now)
            );
            if (stored.isPresent()) {
                row.update(groupName, groupGuid, branchGuid, now);
            }
            repository.save(row);

            ScheduleSessionContext context = new ScheduleSessionContext(groupName, groupGuid, branchGuid);
            session.setAttribute(SESSION_KEY, context);
            return context;
        }
    }

    private static boolean hasGuids(ScheduleSessionContext context) {
        return context != null
            && !isBlank(context.groupGuid())
            && !isBlank(context.branchGuid());
    }

    private static boolean hasGuids(StudentScheduleContext row) {
        return row != null
            && !isBlank(row.getGroupGuid())
            && !isBlank(row.getBranchGuid());
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
