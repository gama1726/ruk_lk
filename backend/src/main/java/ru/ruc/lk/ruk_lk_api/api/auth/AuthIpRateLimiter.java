package ru.ruc.lk.ruk_lk_api.api.auth;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Простой in-memory sliding window rate limit (один инстанс API).
 * Для identify: лимит попыток с одного IP.
 */
@Component
public class AuthIpRateLimiter {

    private final int maxRequests;
    private final long windowMillis;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public AuthIpRateLimiter(
        @Value("${app.auth.identify-rate-limit-max:10}") int maxRequests,
        @Value("${app.auth.identify-rate-limit-window-seconds:60}") long windowSeconds
    ) {
        this.maxRequests = Math.max(1, maxRequests);
        this.windowMillis = Math.max(1, windowSeconds) * 1000L;
    }

    public void checkIdentifyAllowed(HttpServletRequest request) {
        String ip = clientIp(request);
        long now = System.currentTimeMillis();
        long windowStart = now - windowMillis;

        Deque<Long> queue = hits.computeIfAbsent(ip, key -> new ArrayDeque<>());
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst() < windowStart) {
                queue.pollFirst();
            }
            if (queue.size() >= maxRequests) {
                long oldest = queue.peekFirst() == null ? now : queue.peekFirst();
                long retryAfterSec = Math.max(1, (oldest + windowMillis - now + 999) / 1000);
                throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Слишком много попыток входа. Подождите " + retryAfterSec + " с."
                );
            }
            queue.addLast(now);
        }

        // редкая уборка пустых ключей
        if (hits.size() > 10_000) {
            prune(windowStart);
        }
    }

    private void prune(long windowStart) {
        Iterator<Map.Entry<String, Deque<Long>>> it = hits.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Deque<Long>> entry = it.next();
            Deque<Long> queue = entry.getValue();
            synchronized (queue) {
                while (!queue.isEmpty() && queue.peekFirst() < windowStart) {
                    queue.pollFirst();
                }
                if (queue.isEmpty()) {
                    it.remove();
                }
            }
        }
    }

    static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // первый — исходный клиент (FastPanel / nginx)
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote == null || remote.isBlank() ? "unknown" : remote;
    }
}
