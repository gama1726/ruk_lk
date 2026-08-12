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
import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

/**
 * /api/admin/pass-photos/** — нужна сессия админа выбранной роли ({@code X-Admin-Role}).
 * /api/admin/auth/** — открыт.
 */
@Component
public class AdminSessionAuthFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/admin/")) {
            return true;
        }
        return path.startsWith("/api/admin/auth");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        EducationTrack role;
        try {
            role = AdminAuthService.parseRoleHeader(request);
        } catch (ResponseStatusException e) {
            response.setStatus(e.getStatusCode().value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"" + e.getReason() + "\"}");
            return;
        }
        HttpSession session = request.getSession(false);
        if (!AdminAuthService.hasRole(session, role)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Войдите в админ-панель\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
