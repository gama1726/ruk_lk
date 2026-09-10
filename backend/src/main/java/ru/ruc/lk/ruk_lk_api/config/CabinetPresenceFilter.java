package ru.ruc.lk.ruk_lk_api.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.cabinet.CabinetUserService;

/**
 * Обновляет lastSeen для онлайн-счётчика (с троттлингом в сервисе).
 */
@Component
public class CabinetPresenceFilter extends OncePerRequestFilter {

    private final CabinetUserService cabinetUserService;

    public CabinetPresenceFilter(CabinetUserService cabinetUserService) {
        this.cabinetUserService = cabinetUserService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        if (path.startsWith("/api/auth") || path.startsWith("/api/admin") || path.startsWith("/api/health")) {
            return true;
        }
        return !(path.startsWith("/api/student")
            || path.startsWith("/api/parent")
            || path.startsWith("/api/events"));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            HttpSession session = request.getSession(false);
            if (session != null) {
                Object student = session.getAttribute(StudentSessionAuthFilter.SESSION_KEY);
                if (student instanceof StudentSession s) {
                    cabinetUserService.touchStudent(s);
                }
                Object parent = session.getAttribute(ParentAuthService.SESSION_KEY);
                if (parent instanceof ParentSession p) {
                    cabinetUserService.touchParent(p);
                }
            }
        } catch (RuntimeException ignored) {
            // присутствие не должно ломать API
        }
        filterChain.doFilter(request, response);
    }
}
