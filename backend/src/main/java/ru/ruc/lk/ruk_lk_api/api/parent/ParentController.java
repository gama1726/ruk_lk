package ru.ruc.lk.ruk_lk_api.api.parent;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;

@RestController
@RequestMapping("/api/parent")
public class ParentController {

    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    @GetMapping("/schedule/month")
    public ScheduleMonthResponse scheduleMonth(
        HttpSession session,
        @RequestParam int year,
        @RequestParam int month
    ) {
        return parentService.getScheduleMonth(session, year, month);
    }

    @GetMapping("/record-book")
    public RecordBookResponse recordBook(HttpSession session) {
        return parentService.getRecordBook(session);
    }

    /** Опрос университета — доступен родителю даже при servicesBlocked. */
    @GetMapping("/survey")
    public ParentSurveyResponse survey(HttpSession session) {
        ParentSession parent = ParentAuthService.requireParent(session);
        return new ParentSurveyResponse(
            parent.studentFullName(),
            parent.parentFullName(),
            parent.relation(),
            "Опрос университета",
            "Спасибо за участие. Результаты опроса помогают улучшать качество образования."
        );
    }

    public record ParentSurveyResponse(
        String studentFullName,
        String parentFullName,
        String relation,
        String title,
        String description
    ) {}
}
