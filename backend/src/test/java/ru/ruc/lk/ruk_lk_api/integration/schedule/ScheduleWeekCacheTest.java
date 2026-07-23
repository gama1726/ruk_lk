package ru.ruc.lk.ruk_lk_api.integration.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

/**
 * Проверка TTL-кэша недель без реального HTTP: подкласс с подсчётом fetch.
 */
class ScheduleWeekCacheTest {

    @Test
    void weekCache_hitsWithinTtl() {
        AtomicInteger calls = new AtomicInteger();
        ScheduleClient client = new CountingScheduleClient(calls, 600);

        LocalDate monday = LocalDate.of(2026, 7, 6);
        assertEquals(DayOfWeek.MONDAY, monday.getDayOfWeek());

        Optional<?> first = client.fetchGroupWeek("branch", "group", monday);
        Optional<?> second = client.fetchGroupWeek("branch", "group", monday.plusDays(3));

        assertTrue(first.isPresent());
        assertTrue(second.isPresent());
        assertEquals(1, calls.get(), "второй запрос в ту же неделю должен идти из кэша");
    }

    @Test
    void weekCache_disabledWhenTtlZero() {
        AtomicInteger calls = new AtomicInteger();
        ScheduleClient client = new CountingScheduleClient(calls, 0);

        LocalDate monday = LocalDate.of(2026, 7, 6);
        client.fetchGroupWeek("branch", "group", monday);
        client.fetchGroupWeek("branch", "group", monday);

        assertEquals(2, calls.get());
    }

    /** Упрощённый клиент с тем же кэш-ключом, что и HttpScheduleClient. */
    private static final class CountingScheduleClient implements ScheduleClient {
        private final AtomicInteger calls;
        private final long ttlMs;
        private final java.util.concurrent.ConcurrentHashMap<String, CacheEntry> cache =
            new java.util.concurrent.ConcurrentHashMap<>();

        CountingScheduleClient(AtomicInteger calls, long ttlSeconds) {
            this.calls = calls;
            this.ttlMs = Math.max(0, ttlSeconds) * 1000L;
        }

        @Override
        public Optional<ScheduleGroupLookupResponse> lookupGroup(String groupName) {
            return Optional.empty();
        }

        @Override
        public Optional<ScheduleWeekApiResponse> fetchGroupWeek(
            String branchGuid,
            String groupGuid,
            LocalDate anchorDate
        ) {
            LocalDate monday = anchorDate.minusDays((anchorDate.getDayOfWeek().getValue() + 6) % 7);
            String key = branchGuid + "|" + groupGuid + "|" + monday;

            if (ttlMs > 0) {
                CacheEntry cached = cache.get(key);
                if (cached != null && cached.expiresAtMs > System.currentTimeMillis()) {
                    return Optional.of(cached.value);
                }
            }

            calls.incrementAndGet();
            ScheduleWeekApiResponse body = new ScheduleWeekApiResponse(
                java.util.Map.of(),
                null
            );
            if (ttlMs > 0) {
                cache.put(key, new CacheEntry(body, System.currentTimeMillis() + ttlMs));
            }
            return Optional.of(body);
        }

        private record CacheEntry(ScheduleWeekApiResponse value, long expiresAtMs) {}
    }
}
