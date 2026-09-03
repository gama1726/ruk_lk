package ru.ruc.lk.ruk_lk_api.events;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventDto;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

@RestController
@RequestMapping("/api/events")
public class EventsController {

    private final EventService eventService;
    private final OneCClient onecClient;

    public EventsController(EventService eventService, OneCClient onecClient) {
        this.eventService = eventService;
        this.onecClient = onecClient;
    }

    @GetMapping
    public List<CampusEventDto> listForMonth(
        HttpSession session,
        @RequestParam int year,
        @RequestParam int month
    ) {
        String studentId = resolveStudentId(session);
        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        Optional<EventCampus> campus = EventCampusResolver.resolve(profile);
        if (campus.isEmpty()) {
            return List.of();
        }
        return eventService.listPublishedForMonth(campus.get(), year, month);
    }

    private static String resolveStudentId(HttpSession session) {
        if (session != null) {
            Object student = session.getAttribute("STUDENT");
            if (student instanceof StudentSession s && s.studentId() != null && !s.studentId().isBlank()) {
                return s.studentId();
            }
            Object parent = session.getAttribute(ParentAuthService.SESSION_KEY);
            if (parent instanceof ParentSession p && p.studentId() != null && !p.studentId().isBlank()) {
                return p.studentId();
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Необходимо войти в систему");
    }
}
