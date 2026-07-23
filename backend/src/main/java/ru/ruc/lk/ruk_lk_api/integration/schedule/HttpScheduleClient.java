package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class HttpScheduleClient implements ScheduleClient {

    private static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final RestClient restClient;
    private final long weekCacheTtlMs;
    private final ConcurrentHashMap<String, CacheEntry> weekCache = new ConcurrentHashMap<>();

    public HttpScheduleClient(
        @Value("${app.schedule.base-url}") String baseUrl,
        @Value("${app.schedule.week-cache-ttl-seconds:600}") long weekCacheTtlSeconds
    ) {
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .build();
        this.weekCacheTtlMs = Math.max(0, weekCacheTtlSeconds) * 1000L;
    }

    @Override
    public Optional<ScheduleGroupLookupResponse> lookupGroup(String groupName) {
        if (groupName == null || groupName.isBlank()) {
            return Optional.empty();
        }

        try {
            ScheduleGroupLookupResponse body = restClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/v1/get_by_group_name/")
                    .queryParam("group_name", groupName.trim())
                    .build())
                .contentType(MediaType.APPLICATION_JSON)
                .body("")
                .retrieve()
                .body(ScheduleGroupLookupResponse.class);

            if (body == null || body.group() == null || isBlank(body.group().guid())) {
                return Optional.empty();
            }
            return Optional.of(body);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<ScheduleWeekApiResponse> fetchGroupWeek(
        String branchGuid,
        String groupGuid,
        LocalDate anchorDate
    ) {
        if (isBlank(branchGuid) || isBlank(groupGuid) || anchorDate == null) {
            return Optional.empty();
        }

        LocalDate monday = toMonday(anchorDate);
        String cacheKey = weekCacheKey(branchGuid.trim(), groupGuid.trim(), monday);

        if (weekCacheTtlMs > 0) {
            CacheEntry cached = weekCache.get(cacheKey);
            if (cached != null && !cached.isExpired()) {
                return Optional.of(cached.value());
            }
            if (cached != null) {
                weekCache.remove(cacheKey, cached);
            }
        }

        String date = monday.format(API_DATE);

        try {
            ScheduleWeekApiResponse body = restClient.get()
                .uri(
                    "/api/v1/get_schedule/group/{branch}/{group}/{date}",
                    branchGuid.trim(),
                    groupGuid.trim(),
                    date
                )
                .retrieve()
                .body(ScheduleWeekApiResponse.class);

            if (body == null || body.schedule() == null) {
                return Optional.empty();
            }

            if (weekCacheTtlMs > 0) {
                weekCache.put(cacheKey, new CacheEntry(body, System.currentTimeMillis() + weekCacheTtlMs));
                evictExpiredIfNeeded();
            }
            return Optional.of(body);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    private void evictExpiredIfNeeded() {
        if (weekCache.size() < 256) {
            return;
        }
        long now = System.currentTimeMillis();
        weekCache.entrySet().removeIf(entry -> entry.getValue().expiresAtMs() <= now);
    }

    private static String weekCacheKey(String branchGuid, String groupGuid, LocalDate monday) {
        return branchGuid + "|" + groupGuid + "|" + monday;
    }

    private static LocalDate toMonday(LocalDate date) {
        return date.minusDays((date.getDayOfWeek().getValue() + 6) % 7);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record CacheEntry(ScheduleWeekApiResponse value, long expiresAtMs) {
        boolean isExpired() {
            return System.currentTimeMillis() >= expiresAtMs;
        }
    }
}
