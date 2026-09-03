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

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;

/**
 * /api/events/** — студент или родитель.
 */
@Component
public class EventsSessionAuthFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/events");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        boolean student = session != null && session.getAttribute(StudentSessionAuthFilter.SESSION_KEY) != null;
        boolean parent = session != null && session.getAttribute(ParentAuthService.SESSION_KEY) != null;
        if (!student && !parent) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Необходимо войти в систему\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
