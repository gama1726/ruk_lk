package ru.ruc.lk.ruk_lk_api.admin;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.dto.AdminMeResponse;
import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

@Service
public class AdminAuthService {

    public static final String HEADER_ROLE = "X-Admin-Role";
    /** @deprecated старый единый ключ; читаем для миграции в одной сессии */
    private static final String LEGACY_SESSION_KEY = "ADMIN";

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(AdminUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public static String sessionKey(EducationTrack role) {
        return "ADMIN_" + role.name();
    }

    public AdminMeResponse login(HttpServletRequest request, String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите логин и пароль");
        }
        AdminUser user = repository.findByUsernameIgnoreCase(username.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));
        if (!user.isActive() || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        HttpSession session = request.getSession(true);
        // Не инвалидируем всю сессию — студент и вторая админка (SPO/HE) остаются
        session.removeAttribute(LEGACY_SESSION_KEY);
        session.setAttribute(
            sessionKey(user.getRole()),
            new AdminSession(user.getId(), user.getUsername(), user.getRole())
        );
        return new AdminMeResponse(user.getUsername(), user.getRole());
    }

    public void logout(HttpSession session, EducationTrack role) {
        if (session == null || role == null) {
            return;
        }
        session.removeAttribute(sessionKey(role));
        Object legacy = session.getAttribute(LEGACY_SESSION_KEY);
        if (legacy instanceof AdminSession admin && admin.role() == role) {
            session.removeAttribute(LEGACY_SESSION_KEY);
        }
    }

    public AdminMeResponse me(HttpSession session, EducationTrack role) {
        AdminSession admin = requireRole(session, role);
        return new AdminMeResponse(admin.username(), admin.role());
    }

    public static EducationTrack parseRoleHeader(HttpServletRequest request) {
        String raw = request.getHeader(HEADER_ROLE);
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Укажите роль админ-панели");
        }
        try {
            return EducationTrack.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неизвестная роль админ-панели");
        }
    }

    public static boolean hasRole(HttpSession session, EducationTrack role) {
        if (session == null || role == null) {
            return false;
        }
        Object raw = session.getAttribute(sessionKey(role));
        if (raw instanceof AdminSession admin && admin.role() == role) {
            return true;
        }
        Object legacy = session.getAttribute(LEGACY_SESSION_KEY);
        return legacy instanceof AdminSession admin && admin.role() == role;
    }

    public static AdminSession requireRole(HttpSession session, EducationTrack track) {
        if (session == null || track == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админ-панель");
        }
        Object raw = session.getAttribute(sessionKey(track));
        if (raw instanceof AdminSession admin && admin.role() == track) {
            return admin;
        }
        Object legacy = session.getAttribute(LEGACY_SESSION_KEY);
        if (legacy instanceof AdminSession admin && admin.role() == track) {
            return admin;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админ-панель");
    }
}
