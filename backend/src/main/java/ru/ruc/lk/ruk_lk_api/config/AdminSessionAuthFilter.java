package ru.ruc.lk.ruk_lk_api.config;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.AdminAuthService;
import ru.ruc.lk.ruk_lk_api.events.EventsAdminAuthService;
import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

/**
 * /api/admin/pass-photos/** — сессия админа роли ({@code X-Admin-Role}).
 * /api/admin/events/** — сессия редактора календаря ({@code EVENTS_ADMIN}).
 * /api/admin/auth/** и /api/admin/events/auth/** — открыты.
 */
@Component
public class AdminSessionAuthFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/admin/")) {
            return true;
        }
        return path.startsWith("/api/admin/auth")
            || path.startsWith("/api/admin/events/auth");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        HttpSession session = request.getSession(false);

        if (path != null && path.startsWith("/api/admin/events")) {
            if (!EventsAdminAuthService.isLoggedIn(session)) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Войдите в редактор календаря\"}");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        EducationTrack role;
        try {
            role = AdminAuthService.parseRoleHeader(request);
        } catch (ResponseStatusException e) {
            response.setStatus(e.getStatusCode().value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"" + e.getReason() + "\"}");
            return;
        }
        if (!AdminAuthService.hasRole(session, role)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Войдите в админ-панель\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
