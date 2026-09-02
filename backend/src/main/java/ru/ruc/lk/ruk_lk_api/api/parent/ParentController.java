package ru.ruc.lk.ruk_lk_api.api.parent;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;

@RestController
@RequestMapping("/api/parent")
public class ParentController {

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
