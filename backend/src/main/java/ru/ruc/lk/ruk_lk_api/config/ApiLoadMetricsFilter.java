package ru.ruc.lk.ruk_lk_api.config;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ru.ruc.lk.ruk_lk_api.metrics.ApiLoadMetrics;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class ApiLoadMetricsFilter extends OncePerRequestFilter {

    private final ApiLoadMetrics metrics;

    public ApiLoadMetricsFilter(ApiLoadMetrics metrics) {
        this.metrics = metrics;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String method = request.getMethod() == null ? "GET" : request.getMethod();
        String path = request.getRequestURI();
        long started = System.nanoTime();
        metrics.begin(method, path);
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - started) / 1_000_000L;
            metrics.end(method, path, response.getStatus(), durationMs);
        }
    }
}
