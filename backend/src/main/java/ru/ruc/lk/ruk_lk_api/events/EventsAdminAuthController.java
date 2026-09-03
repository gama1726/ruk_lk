package ru.ruc.lk.ruk_lk_api.events;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.events.dto.EventsAdminLoginRequest;
import ru.ruc.lk.ruk_lk_api.events.dto.EventsAdminMeResponse;

@RestController
@RequestMapping("/api/admin/events/auth")
public class EventsAdminAuthController {

    private final EventsAdminAuthService authService;

    public EventsAdminAuthController(EventsAdminAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public EventsAdminMeResponse login(@RequestBody EventsAdminLoginRequest body, HttpServletRequest request) {
        return authService.login(
            request,
            body != null ? body.username() : null,
            body != null ? body.password() : null
        );
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        authService.logout(session);
        return Map.of("ok", "true");
    }

    @GetMapping("/me")
    public EventsAdminMeResponse me(HttpSession session) {
        return authService.me(session);
    }
}
