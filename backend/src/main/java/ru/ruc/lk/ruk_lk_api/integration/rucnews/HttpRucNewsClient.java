package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
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

    public HttpRucNewsClient(RucNewsProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
            .requestFactory(factory)
            .defaultHeader("Accept", "text/html,application/xhtml+xml")
            .defaultHeader("User-Agent", "ruk-lk-api/1.0 (+news)")
            .build();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public List<RucNewsItem> fetchLatest() {
        CacheEntry cached = cache.get();
        Instant now = Instant.now();
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.items();
        }
        synchronized (this) {
            cached = cache.get();
            if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
                return cached.items();
            }
            List<RucNewsItem> fresh = load();
            cache.set(new CacheEntry(
                fresh,
                Instant.now().plusSeconds(properties.cacheTtlSeconds())
            ));
            return fresh;
        }
    }

    private List<RucNewsItem> load() {
        try {
            String html = restClient.get()
                .uri(properties.listUrl())
                .retrieve()
                .body(String.class);
            List<RucNewsItem> items = RucNewsHtmlParser.parse(html, properties.baseUrl());
            log.info("Ruc news: fetched {} items from {}", items.size(), properties.listUrl());
            return List.copyOf(items);
        } catch (RestClientException e) {
            log.warn("Ruc news fetch failed: {}", e.getMessage());
            CacheEntry stale = cache.get();
            if (stale != null) {
                return stale.items();
            }
            return List.of();
        }
    }

    private record CacheEntry(List<RucNewsItem> items, Instant expiresAt) {}
}
