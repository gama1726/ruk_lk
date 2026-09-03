package ru.ruc.lk.ruk_lk_api.events;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.events.dto.EventsAdminMeResponse;

@Service
@EnableConfigurationProperties(EventsAdminProperties.class)
public class EventsAdminAuthService {

    public static final String SESSION_KEY = "EVENTS_ADMIN";

    private final EventsAdminProperties properties;

    public EventsAdminAuthService(EventsAdminProperties properties) {
        this.properties = properties;
    }

    public EventsAdminMeResponse login(HttpServletRequest request, String username, String password) {
        String expectedUser = properties.username() == null ? "" : properties.username().trim();
        String expectedPassword = properties.password() == null ? "" : properties.password();
        if (expectedUser.isBlank() || expectedPassword.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Редактор календаря не настроен: задайте app.events-admin.username и .password"
            );
        }
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите логин и пароль");
        }
        if (!expectedUser.equalsIgnoreCase(username.trim()) || !expectedPassword.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SESSION_KEY, new EventsAdminSession(expectedUser));
        return new EventsAdminMeResponse(expectedUser);
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
    }

    public EventsAdminMeResponse me(HttpSession session) {
        EventsAdminSession admin = require(session);
        return new EventsAdminMeResponse(admin.username());
    }

    public static boolean isLoggedIn(HttpSession session) {
        return session != null && session.getAttribute(SESSION_KEY) instanceof EventsAdminSession;
    }

    public static EventsAdminSession require(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в редактор календаря");
        }
        Object raw = session.getAttribute(SESSION_KEY);
        if (raw instanceof EventsAdminSession admin) {
            return admin;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в редактор календаря");
    }
}
