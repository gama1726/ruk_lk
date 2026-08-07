package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * HTML-парсер ленты new.ruc.su/blog с in-memory кэшем.
 */
@Component
@ConditionalOnProperty(name = "app.ruc-news.enabled", havingValue = "true")
public class HttpRucNewsClient implements RucNewsClient {

    private static final Logger log = LoggerFactory.getLogger(HttpRucNewsClient.class);

    private final RestClient restClient;
    private final RucNewsProperties properties;
    private final AtomicReference<CacheEntry> cache = new AtomicReference<>();
    private final AtomicBoolean lastOk = new AtomicBoolean(false);

    public HttpRucNewsClient(RucNewsProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder()
            .requestFactory(factory)
            .defaultHeader("Accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")
            .defaultHeader("Accept-Language", "ru-RU,ru;q=0.9")
            .defaultHeader(
                "User-Agent",
                "Mozilla/5.0 (compatible; ruk-lk-api/1.0; +https://my.ruc.su)"
            )
            .build();
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
            // Не кэшируем долгий пустой провал — иначе 15 минут «Нет новостей»
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
        try {
            String html = restClient.get()
                .uri(properties.listUrl())
                .retrieve()
                .body(String.class);
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
        } catch (RestClientException e) {
            log.warn("Ruc news fetch failed: {}", e.getMessage());
            CacheEntry stale = cache.get();
            if (stale != null && !stale.items().isEmpty()) {
                return new LoadResult(true, stale.items());
            }
            return LoadResult.fail();
        }
    }

    private record CacheEntry(List<RucNewsItem> items, Instant expiresAt, boolean ok) {}

    private record LoadResult(boolean ok, List<RucNewsItem> items) {
        static LoadResult fail() {
            return new LoadResult(false, List.of());
        }
    }
}
