package ru.ruc.lk.ruk_lk_api.metrics;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.DoubleAdder;
import java.util.concurrent.atomic.LongAdder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import ru.ruc.lk.ruk_lk_api.metrics.dto.ApiLoadEndpointDto;
import ru.ruc.lk.ruk_lk_api.metrics.dto.OutboundErrorDto;
import ru.ruc.lk.ruk_lk_api.metrics.dto.OutboundLoadSnapshotDto;

/**
 * Нагрузка исходящих HTTP-вызовов к внешним сервисам (1С, Unisender, расписание, …).
 */
@Component
public class OutboundLoadMetrics {

    private static final Logger log = LoggerFactory.getLogger(OutboundLoadMetrics.class);
    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_KEYS = 400;
    private static final int MAX_RECENT_ERRORS = 40;

    private final OutboundServiceLoadStatsRepository repository;
    private final ConcurrentHashMap<String, EndpointStats> byKey = new ConcurrentHashMap<>();
    private final AtomicInteger totalInFlight = new AtomicInteger();
    private final AtomicBoolean dirty = new AtomicBoolean(false);
    private final Deque<OutboundErrorDto> recentErrors = new ArrayDeque<>();

    public OutboundLoadMetrics(OutboundServiceLoadStatsRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    void loadPersisted() {
        try {
            for (OutboundServiceLoadStats row : repository.findAll()) {
                byKey.put(row.getId(), EndpointStats.fromPersisted(row));
            }
            log.info("Загружено {} outbound-метрик из БД", byKey.size());
        } catch (RuntimeException e) {
            log.warn("Не удалось загрузить outbound-метрики: {}", e.getMessage());
        }
    }

    public void begin(String service, String operation) {
        String svc = normalizeService(service);
        String op = normalizeOperation(operation);
        String key = key(svc, op);
        EndpointStats stats = byKey.computeIfAbsent(key, k -> new EndpointStats(svc, op));
        if (byKey.size() > MAX_KEYS) {
            pruneIdle();
        }
        int current = stats.inFlight.incrementAndGet();
        totalInFlight.incrementAndGet();
        stats.hit();
        stats.sampleInFlight(current);
        dirty.set(true);
    }

    public void end(String service, String operation, int status, long durationMs) {
        end(service, operation, status, durationMs, null);
    }

    public void end(String service, String operation, int status, long durationMs, String detail) {
        String svc = normalizeService(service);
        String op = normalizeOperation(operation);
        String key = key(svc, op);
        EndpointStats stats = byKey.get(key);
        if (stats == null) {
            return;
        }
        stats.inFlight.updateAndGet(v -> Math.max(0, v - 1));
        totalInFlight.updateAndGet(v -> Math.max(0, v - 1));
        stats.recordCompletion(Math.max(0, durationMs), status);
        if (status >= 400) {
            pushError(svc, op, status, detail);
        }
        dirty.set(true);
    }

    /**
     * HTTP 2xx, но логическая ошибка (например UniSender status != success).
     * Уже учтённый successful completion переводим в 5xx.
     */
    public void recordApplicationError(String service, String operation, int status, String detail) {
        String svc = normalizeService(service);
        String op = normalizeOperation(operation);
        String key = key(svc, op);
        EndpointStats stats = byKey.computeIfAbsent(key, k -> new EndpointStats(svc, op));
        stats.markApplicationError(status >= 400 ? status : 502);
        pushError(svc, op, status >= 400 ? status : 502, detail);
        dirty.set(true);
    }

    private void pushError(String service, String operation, int status, String detail) {
        OutboundErrorDto row = new OutboundErrorDto(
            System.currentTimeMillis(),
            service,
            operation,
            status,
            detail == null || detail.isBlank() ? "" : (detail.length() > 200 ? detail.substring(0, 200) : detail)
        );
        synchronized (recentErrors) {
            recentErrors.addFirst(row);
            while (recentErrors.size() > MAX_RECENT_ERRORS) {
                recentErrors.removeLast();
            }
        }
    }

    public void resetAll() {
        byKey.clear();
        totalInFlight.set(0);
        synchronized (recentErrors) {
            recentErrors.clear();
        }
        try {
            repository.deleteAllInBatch();
        } catch (RuntimeException e) {
            log.warn("Не удалось очистить outbound_service_load_stats: {}", e.getMessage());
        }
        dirty.set(false);
        log.info("Метрики исходящей нагрузки сброшены");
    }

    public OutboundLoadSnapshotDto snapshot() {
        long now = System.currentTimeMillis();
        sampleRpmAll(now);
        List<ApiLoadEndpointDto> rows = new ArrayList<>();
        int inFlightSum = 0;
        double rpmSum = 0;

        for (EndpointStats stats : byKey.values()) {
            stats.rotateIfNeeded(now);
            int inFlight = Math.max(0, stats.inFlight.get());
            double rpm = stats.requestsInWindow(now);
            long completed = stats.completed.sum();
            if (inFlight == 0 && rpm < 0.01 && completed == 0 && stats.maxInFlight.get() == 0) {
                continue;
            }
            inFlightSum += inFlight;
            rpmSum += rpm;
            rows.add(stats.toDto(inFlight, rpm));
        }

        rows.sort(Comparator
            .comparingInt(ApiLoadEndpointDto::inFlight).reversed()
            .thenComparingInt(ApiLoadEndpointDto::maxInFlightAllTime).reversed()
            .thenComparingDouble(ApiLoadEndpointDto::requestsPerMinute).reversed());

        return new OutboundLoadSnapshotDto(
            Math.max(totalInFlight.get(), inFlightSum),
            round1(rpmSum),
            rows,
            recentErrorsSnapshot()
        );
    }

    private List<OutboundErrorDto> recentErrorsSnapshot() {
        synchronized (recentErrors) {
            return List.copyOf(recentErrors);
        }
    }

    @Scheduled(fixedDelayString = "10000")
    public void flushAndSample() {
        long now = System.currentTimeMillis();
        sampleRpmAll(now);
        if (!dirty.compareAndSet(true, false) && byKey.isEmpty()) {
            return;
        }
        try {
            persistAll();
        } catch (RuntimeException e) {
            dirty.set(true);
            log.warn("Не удалось сохранить outbound-метрики: {}", e.getMessage());
        }
    }

    private void sampleRpmAll(long now) {
        for (EndpointStats stats : byKey.values()) {
            double rpm = stats.requestsInWindow(now);
            if (rpm > 0.01) {
                stats.sampleRpm(rpm);
                dirty.set(true);
            }
        }
    }

    private void persistAll() {
        List<OutboundServiceLoadStats> rows = new ArrayList<>();
        for (EndpointStats stats : byKey.values()) {
            rows.add(stats.toEntity());
        }
        if (!rows.isEmpty()) {
            repository.saveAll(rows);
        }
    }

    private void pruneIdle() {
        long now = System.currentTimeMillis();
        for (Map.Entry<String, EndpointStats> e : byKey.entrySet()) {
            EndpointStats s = e.getValue();
            s.rotateIfNeeded(now);
            if (s.inFlight.get() == 0
                && s.requestsInWindow(now) < 0.01
                && s.completed.sum() == 0
                && s.maxInFlight.get() == 0) {
                byKey.remove(e.getKey(), s);
            }
        }
        Set<String> keep = new HashSet<>();
        byKey.entrySet().stream()
            .sorted((a, b) -> Integer.compare(
                b.getValue().maxInFlight.get(),
                a.getValue().maxInFlight.get()))
            .limit(MAX_KEYS)
            .forEach(e -> keep.add(e.getKey()));
        byKey.keySet().removeIf(k -> !keep.contains(k));
    }

    private static String normalizeService(String service) {
        if (service == null || service.isBlank()) {
            return "unknown";
        }
        String s = service.trim().toLowerCase();
        return s.length() > 32 ? s.substring(0, 32) : s;
    }

    /** Операции вроде send-login-code не режем как URL. */
    private static String normalizeOperation(String operation) {
        if (operation == null || operation.isBlank()) {
            return "unknown";
        }
        String s = operation.trim().replace('_', '-');
        if (s.startsWith("GET ") || s.startsWith("POST ") || s.startsWith("PUT ")
            || s.startsWith("PATCH ") || s.startsWith("DELETE ")) {
            int sp = s.indexOf(' ');
            return s.substring(0, sp + 1) + ApiLoadMetrics.normalize(s.substring(sp + 1));
        }
        return s.length() > 120 ? s.substring(0, 120) : s;
    }

    private static String key(String service, String operation) {
        return service + " " + operation;
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static final class EndpointStats {
        private final String service;
        private final String operation;
        private final AtomicInteger inFlight = new AtomicInteger();
        private final LongAdder completed = new LongAdder();
        private final LongAdder totalDurationMs = new LongAdder();
        private final AtomicLong minDurationMs = new AtomicLong(Long.MAX_VALUE);
        private final AtomicLong maxDurationMs = new AtomicLong();
        private final LongAdder errors4xx = new LongAdder();
        private final LongAdder errors5xx = new LongAdder();
        private final AtomicLong windowStartMs = new AtomicLong(System.currentTimeMillis());
        private final LongAdder windowCount = new LongAdder();
        private final AtomicInteger maxInFlight = new AtomicInteger();
        private final AtomicInteger minInFlight = new AtomicInteger(Integer.MAX_VALUE);
        private final LongAdder sumInFlightSamples = new LongAdder();
        private final LongAdder inFlightSampleCount = new LongAdder();
        private final AtomicLong maxRpmX10 = new AtomicLong();
        private final AtomicLong minRpmX10 = new AtomicLong(Long.MAX_VALUE);
        private final DoubleAdder sumRpmSamples = new DoubleAdder();
        private final LongAdder rpmSampleCount = new LongAdder();

        private EndpointStats(String service, String operation) {
            this.service = service;
            this.operation = operation;
        }

        private static EndpointStats fromPersisted(OutboundServiceLoadStats row) {
            EndpointStats s = new EndpointStats(row.getMethod(), row.getPath());
            s.completed.add(row.getCompletedTotal());
            s.totalDurationMs.add(row.getSumDurationMs());
            if (row.getMinDurationMs() > 0 && row.getMinDurationMs() < Long.MAX_VALUE) {
                s.minDurationMs.set(row.getMinDurationMs());
            }
            s.maxDurationMs.set(row.getMaxDurationMs());
            s.errors4xx.add(row.getErrors4xx());
            s.errors5xx.add(row.getErrors5xx());
            s.maxInFlight.set(row.getMaxInFlight());
            if (row.getMinInFlight() > 0 && row.getMinInFlight() < Integer.MAX_VALUE) {
                s.minInFlight.set(row.getMinInFlight());
            }
            s.sumInFlightSamples.add(row.getSumInFlightSamples());
            s.inFlightSampleCount.add(row.getInFlightSampleCount());
            s.maxRpmX10.set(Math.round(row.getMaxRpm() * 10));
            if (row.getMinRpm() > 0 && row.getMinRpm() < Double.MAX_VALUE) {
                s.minRpmX10.set(Math.round(row.getMinRpm() * 10));
            }
            s.sumRpmSamples.add(row.getSumRpmSamples());
            s.rpmSampleCount.add(row.getRpmSampleCount());
            return s;
        }

        private void hit() {
            long now = System.currentTimeMillis();
            rotateIfNeeded(now);
            windowCount.increment();
        }

        private void sampleInFlight(int current) {
            maxInFlight.updateAndGet(v -> Math.max(v, current));
            if (current > 0) {
                minInFlight.updateAndGet(v -> Math.min(v, current));
                sumInFlightSamples.add(current);
                inFlightSampleCount.increment();
            }
        }

        private void sampleRpm(double rpm) {
            long x10 = Math.round(rpm * 10);
            maxRpmX10.updateAndGet(v -> Math.max(v, x10));
            if (rpm > 0.01) {
                minRpmX10.updateAndGet(v -> Math.min(v, x10));
                sumRpmSamples.add(rpm);
                rpmSampleCount.increment();
            }
        }

        private void recordCompletion(long durationMs, int status) {
            completed.increment();
            totalDurationMs.add(durationMs);
            minDurationMs.updateAndGet(v -> Math.min(v, durationMs));
            maxDurationMs.updateAndGet(v -> Math.max(v, durationMs));
            if (status >= 500) {
                errors5xx.increment();
            } else if (status >= 400) {
                errors4xx.increment();
            }
        }

        private void markApplicationError(int status) {
            if (status >= 500) {
                errors5xx.increment();
            } else if (status >= 400) {
                errors4xx.increment();
            }
        }

        private void rotateIfNeeded(long now) {
            long start = windowStartMs.get();
            if (now - start < WINDOW_MS) {
                return;
            }
            if (windowStartMs.compareAndSet(start, now)) {
                windowCount.reset();
            }
        }

        private double requestsInWindow(long now) {
            rotateIfNeeded(now);
            long start = windowStartMs.get();
            long elapsed = Math.max(1L, now - start);
            return windowCount.sum() / (double) elapsed * 60_000.0;
        }

        private ApiLoadEndpointDto toDto(int inFlight, double rpm) {
            long done = completed.sum();
            double avgMs = done == 0 ? 0 : (double) totalDurationMs.sum() / done;
            long minMs = minDurationMs.get();
            if (minMs == Long.MAX_VALUE) {
                minMs = 0;
            }
            long samples = inFlightSampleCount.sum();
            double avgIf = samples == 0 ? 0 : (double) sumInFlightSamples.sum() / samples;
            int minIf = minInFlight.get();
            if (minIf == Integer.MAX_VALUE) {
                minIf = 0;
            }
            long rpmSamples = rpmSampleCount.sum();
            double avgRpm = rpmSamples == 0 ? 0 : sumRpmSamples.sum() / rpmSamples;
            double minRpm = minRpmX10.get() == Long.MAX_VALUE ? 0 : minRpmX10.get() / 10.0;
            double maxRpm = maxRpmX10.get() / 10.0;
            return new ApiLoadEndpointDto(
                service,
                operation,
                inFlight,
                round1(rpm),
                done,
                errors4xx.sum(),
                errors5xx.sum(),
                round1(avgMs),
                round1(minMs),
                round1(maxDurationMs.get()),
                round1(avgIf),
                minIf,
                maxInFlight.get(),
                round1(avgRpm),
                round1(minRpm),
                round1(maxRpm)
            );
        }

        private OutboundServiceLoadStats toEntity() {
            OutboundServiceLoadStats row =
                new OutboundServiceLoadStats(key(service, operation), service, operation);
            row.setCompletedTotal(completed.sum());
            row.setErrors4xx(errors4xx.sum());
            row.setErrors5xx(errors5xx.sum());
            row.setSumDurationMs(totalDurationMs.sum());
            long minMs = minDurationMs.get();
            row.setMinDurationMs(minMs == Long.MAX_VALUE ? 0 : minMs);
            row.setMaxDurationMs(maxDurationMs.get());
            row.setMaxInFlight(maxInFlight.get());
            int minIf = minInFlight.get();
            row.setMinInFlight(minIf == Integer.MAX_VALUE ? 0 : minIf);
            row.setSumInFlightSamples(sumInFlightSamples.sum());
            row.setInFlightSampleCount(inFlightSampleCount.sum());
            row.setMaxRpm(maxRpmX10.get() / 10.0);
            double minRpm = minRpmX10.get() == Long.MAX_VALUE ? 0 : minRpmX10.get() / 10.0;
            row.setMinRpm(minRpm);
            row.setSumRpmSamples(sumRpmSamples.sum());
            row.setRpmSampleCount(rpmSampleCount.sum());
            row.setUpdatedAt(Instant.now());
            return row;
        }
    }
}
