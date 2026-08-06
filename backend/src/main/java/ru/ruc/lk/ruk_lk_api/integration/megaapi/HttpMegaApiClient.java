package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * HTTP-клиент МегаAPI (ilibrary): GetReader / GetHandBooks / GetDebtBooks / GetOrderBooks.
 * {@code rdr_id} — номер зачётки (читательского билета).
 */
@Component
@ConditionalOnProperty(name = "app.megaapi.enabled", havingValue = "true")
public class HttpMegaApiClient implements MegaApiClient {

    private static final Logger log = LoggerFactory.getLogger(HttpMegaApiClient.class);

    private final RestClient restClient;
    private final int dbidx;

    public HttpMegaApiClient(MegaApiProperties properties) {
        if (properties.tokenGet() == null || properties.tokenGet().isBlank()) {
            throw new IllegalStateException(
                "app.megaapi.enabled=true, но app.megaapi.token-get пуст"
            );
        }
        this.dbidx = properties.dbidx();
        this.restClient = RestClient.builder()
            .baseUrl(properties.baseUrl())
            .defaultHeader("x-auth-token", properties.tokenGet())
            .defaultHeader("Accept", "application/json")
            .build();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public Optional<MegaReaderRecord> getReader(String rdrId) {
        try {
            MegaReaderRecord reader = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/GetReader")
                    .queryParam("rdr_id", rdrId)
                    .queryParam("dbidx", dbidx)
                    .build())
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(MegaReaderRecord.class);
            if (reader == null || isBlank(reader.rdrId()) && isBlank(reader.name())) {
                return Optional.empty();
            }
            return Optional.of(reader);
        } catch (HttpClientErrorException e) {
            log.debug("MegaAPI GetReader {}: {}", rdrId, e.getStatusCode());
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("MegaAPI GetReader failed for {}: {}", rdrId, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<MegaBookItem> getHandBooks(String rdrId) {
        return fetchBooks("/GetHandBooks", rdrId);
    }

    @Override
    public List<MegaBookItem> getDebtBooks(String rdrId) {
        return fetchBooks("/GetDebtBooks", rdrId);
    }

    @Override
    public List<MegaBookItem> getOrderBooks(String rdrId) {
        return fetchBooks("/GetOrderBooks", rdrId);
    }

    private List<MegaBookItem> fetchBooks(String path, String rdrId) {
        try {
            MegaBookItem[] items = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path(path)
                    .queryParam("rdr_id", rdrId)
                    .queryParam("dbidx", dbidx)
                    .build())
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(MegaBookItem[].class);
            if (items == null || items.length == 0) {
                return List.of();
            }
            return Arrays.asList(items);
        } catch (HttpClientErrorException e) {
            log.debug("MegaAPI {} {}: {}", path, rdrId, e.getStatusCode());
            return List.of();
        } catch (RestClientException e) {
            log.warn("MegaAPI {} failed for {}: {}", path, rdrId, e.getMessage());
            return List.of();
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
