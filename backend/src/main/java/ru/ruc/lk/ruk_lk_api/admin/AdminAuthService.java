package ru.ruc.lk.ruk_lk_api.admin;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.dto.AdminMeResponse;
import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

@Service
public class AdminAuthService {

    public static final String SESSION_KEY = "ADMIN";

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(AdminUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminMeResponse login(jakarta.servlet.http.HttpServletRequest request, String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите логин и пароль");
        }
        AdminUser user = repository.findByUsernameIgnoreCase(username.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));
        if (!user.isActive() || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        HttpSession old = request.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setAttribute(SESSION_KEY, new AdminSession(user.getId(), user.getUsername(), user.getRole()));
        return new AdminMeResponse(user.getUsername(), user.getRole());
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }

    public AdminMeResponse me(HttpSession session) {
        AdminSession admin = requireAdmin(session);
        return new AdminMeResponse(admin.username(), admin.role());
    }

    public static AdminSession requireAdmin(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админку");
        }
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof AdminSession admin)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админку");
        }
        return admin;
    }

    public static AdminSession requireRole(HttpSession session, EducationTrack track) {
        AdminSession admin = requireAdmin(session);
        if (admin.role() != track) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к этой очереди");
        }
        return admin;
    }
}
