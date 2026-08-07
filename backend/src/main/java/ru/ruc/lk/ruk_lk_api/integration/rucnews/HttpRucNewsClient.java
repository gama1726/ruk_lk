package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
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
            String html = fetchViaCurl();
            if (html == null || html.isBlank()) {
                log.warn("Ruc news: empty body from {}", properties.listUrl());
                return LoadResult.fail();
            }
            List<RucNewsItem> items = RucNewsHtmlParser.parse(html, properties.baseUrl());
            log.info(
                "Ruc news: fetched {} items from {} (html {} chars)",
                items.size(),
                properties.listUrl(),
                html.length()
            );
            if (items.isEmpty()) {
                log.warn("Ruc news: HTML downloaded but parser found 0 cards");
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

    private String fetchViaCurl() throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
            "curl", "-sS", "-L",
            "--connect-timeout", "8",
            "--max-time", "20",
            "-A", USER_AGENT,
            "-H", "Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "-H", "Accept-Language: ru-RU,ru;q=0.9",
            properties.listUrl()
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
            throw new IllegalStateException("curl timed out");
        }
        int code = process.exitValue();
        if (code != 0) {
            throw new IllegalStateException(
                "curl exit " + code + ": " + body.substring(0, Math.min(200, body.length()))
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
