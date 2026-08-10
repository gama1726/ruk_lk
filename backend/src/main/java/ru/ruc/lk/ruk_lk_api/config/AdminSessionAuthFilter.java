package ru.ruc.lk.ruk_lk_api.config;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.AdminAuthService;
import ru.ruc.lk.ruk_lk_api.admin.AdminSession;

/**
 * /api/admin/pass-photos/** — только при сессии ADMIN.
 * /api/admin/auth/** — открыт (login / reset).
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
        HttpSession session = request.getSession(false);
        Object raw = session == null ? null : session.getAttribute(AdminAuthService.SESSION_KEY);
        if (!(raw instanceof AdminSession)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Войдите в админку\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
