package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Лента new.ruc.su/blog через {@code curl}: старый nginx отдаёт только TLS_RSA_*,
 * а ослабление {@code jdk.tls.disabledAlgorithms} ломает HTTPS к MAX и другим API.
 * Тянет страницы пагинации, пока не выйдем за текущий календарный месяц.
 */
@Component
@ConditionalOnProperty(name = "app.ruc-news.enabled", havingValue = "true")
public class HttpRucNewsClient implements RucNewsClient {

    private static final Logger log = LoggerFactory.getLogger(HttpRucNewsClient.class);
    private static final String USER_AGENT =
        "Mozilla/5.0 (compatible; ruk-lk-api/1.0; +https://my.ruc.su)";

    private final RucNewsProperties properties;
    private final AtomicReference<CacheEntry> cache = new AtomicReference<>();
    private final AtomicBoolean lastOk = new AtomicBoolean(false);
    private final boolean curlAvailable;

    public HttpRucNewsClient(RucNewsProperties properties) {
        this.properties = properties;
        this.curlAvailable = isCurlOnPath();
        log.info("Ruc news: curl={}", curlAvailable ? "yes" : "MISSING — news fetch disabled");
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public boolean lastFetchOk() {
        return lastOk.get();
    }

    @Override
    public List<RucNewsItem> fetchLatest() {
        CacheEntry cached = cache.get();
        Instant now = Instant.now();
        if (cached != null && cached.expiresAt().isAfter(now)) {
            lastOk.set(cached.ok());
            return cached.items();
        }
        synchronized (this) {
            cached = cache.get();
            if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
                lastOk.set(cached.ok());
                return cached.items();
            }
            LoadResult loaded = load();
            lastOk.set(loaded.ok());
            long ttl = loaded.ok() && !loaded.items().isEmpty()
                ? properties.cacheTtlSeconds()
                : Math.min(60, properties.cacheTtlSeconds());
            if (loaded.ok() || !loaded.items().isEmpty()) {
                cache.set(new CacheEntry(
                    loaded.items(),
                    Instant.now().plusSeconds(ttl),
                    loaded.ok()
                ));
            }
            return loaded.items();
        }
    }

    private LoadResult load() {
        if (!curlAvailable) {
            log.warn("Ruc news: curl not on PATH, skip fetch");
            return LoadResult.fail();
        }
        try {
            LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
            Map<String, RucNewsItem> byId = new LinkedHashMap<>();
            int pagesFetched = 0;
            boolean reachedOlderMonth = false;

            for (int page = 1; page <= properties.maxPages(); page++) {
                String pageUrl = pageUrl(properties.listUrl(), page);
                String html = fetchViaCurl(pageUrl);
                if (html == null || html.isBlank()) {
                    log.warn("Ruc news: empty body from {}", pageUrl);
                    break;
                }
                List<RucNewsItem> pageItems = RucNewsHtmlParser.parse(html, properties.baseUrl());
                pagesFetched++;
                if (pageItems.isEmpty()) {
                    break;
                }

                boolean pageHasCurrentMonth = false;
                for (RucNewsItem item : pageItems) {
                    LocalDate date = parseIsoDate(item.date());
                    if (date == null) {
                        byId.putIfAbsent(item.id(), item);
                        pageHasCurrentMonth = true;
                        continue;
                    }
                    if (!date.isBefore(monthStart)) {
                        byId.putIfAbsent(item.id(), item);
                        pageHasCurrentMonth = true;
                    } else {
                        reachedOlderMonth = true;
                    }
                }

                if (reachedOlderMonth || !pageHasCurrentMonth) {
                    break;
                }
            }

            List<RucNewsItem> items = new ArrayList<>(byId.values());
            items.sort(Comparator
                .comparing((RucNewsItem i) -> i.date() == null ? "" : i.date())
                .reversed());

            log.info(
                "Ruc news: {} items for month from {} (pages={}, monthStart={})",
                items.size(),
                properties.listUrl(),
                pagesFetched,
                monthStart
            );
            if (items.isEmpty()) {
                log.warn("Ruc news: no items for current month");
            }
            return new LoadResult(true, List.copyOf(items));
        } catch (Exception e) {
            log.warn("Ruc news fetch failed: {}", e.getMessage());
            CacheEntry stale = cache.get();
            if (stale != null && !stale.items().isEmpty()) {
                return new LoadResult(true, stale.items());
            }
            return LoadResult.fail();
        }
    }

    static String pageUrl(String listUrl, int page) {
        if (page <= 1) {
            return listUrl;
        }
        String sep = listUrl.contains("?") ? "&" : "?";
        return listUrl + sep + "PAGEN_1=" + page;
    }

    private static LocalDate parseIsoDate(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(iso.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String fetchViaCurl(String url) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
            "curl", "-sS", "-L",
            "--connect-timeout", "8",
            "--max-time", "20",
            "-A", USER_AGENT,
            "-H", "Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "-H", "Accept-Language: ru-RU,ru;q=0.9",
            url
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String body;
        try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8)
        )) {
            body = reader.lines().collect(Collectors.joining("\n"));
        }
        boolean finished = process.waitFor(25, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("curl timed out for " + url);
        }
        int code = process.exitValue();
        if (code != 0) {
            throw new IllegalStateException(
                "curl exit " + code + " for " + url + ": "
                    + body.substring(0, Math.min(200, body.length()))
            );
        }
        return body;
    }

    private static boolean isCurlOnPath() {
        try {
            Process process = new ProcessBuilder("curl", "--version").start();
            boolean finished = process.waitFor(3, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private record CacheEntry(List<RucNewsItem> items, Instant expiresAt, boolean ok) {}

    private record LoadResult(boolean ok, List<RucNewsItem> items) {
        static LoadResult fail() {
            return new LoadResult(false, List.of());
        }
    }
}
