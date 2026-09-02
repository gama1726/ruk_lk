package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import javax.net.ssl.SSLContext;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.DefaultClientTlsStrategy;
import org.apache.hc.client5.http.ssl.HostnameVerificationPolicy;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.client5.http.ssl.TrustAllStrategy;
import org.apache.hc.core5.ssl.SSLContexts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;

@Component
@ConditionalOnProperty(name = "app.zkbio.kazan.enabled", havingValue = "true")
public class HttpZKBioClient implements ZKBioClient {

    private static final Logger log = LoggerFactory.getLogger(HttpZKBioClient.class);
    private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RestClient restClient;
    private final ZKBioProperties properties;
    /** studentId (зачётка) → emp_code для transactions. */
    private final ConcurrentHashMap<String, String> empCodeByStudentId = new ConcurrentHashMap<>();
    private String token;

    public HttpZKBioClient(ZKBioProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
            .baseUrl(trimTrailingSlash(properties.baseUrl()))
            .requestFactory(buildRequestFactory(properties.trustSelfSigned()))
            .build();
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public List<SkudAccessEvent> fetchAccessEvents(String studentId, LocalDate from, LocalDate to)
        throws ZKBioException {
        if (studentId == null || studentId.isBlank()) {
            throw new ZKBioException("Не указан номер зачётки для ZKBio");
        }
        if (from == null || to == null) {
            throw new ZKBioException("Укажите период проходов");
        }
        LocalDate begin = from.isBefore(to) ? from : to;
        LocalDate end = from.isBefore(to) ? to : from;
        String gradebook = studentId.trim();

        authenticate();

        List<SkudAccessEvent> events = fetchAllTransactions(gradebook, begin, end);
        if (!events.isEmpty()) {
            log.info("ZKBio проходы: emp_code={}, {}..{}, событий={}", gradebook, begin, end, events.size());
            return events;
        }

        String resolvedCode = empCodeByStudentId.computeIfAbsent(gradebook, id -> {
            try {
                return resolveEmpCode(id).orElse(id);
            } catch (ZKBioException e) {
                log.warn("ZKBio lookup emp_code для {}: {}", id, e.getMessage());
                return id;
            }
        });

        if (!resolvedCode.equals(gradebook)) {
            events = fetchAllTransactions(resolvedCode, begin, end);
            log.info(
                "ZKBio проходы: emp_code={} (зачётка {}), {}..{}, событий={}",
                resolvedCode,
                gradebook,
                begin,
                end,
                events.size()
            );
            return events;
        }

        log.info("ZKBio проходы: emp_code={}, {}..{}, событий=0", gradebook, begin, end);
        return List.of();
    }

    private List<SkudAccessEvent> fetchAllTransactions(String empCode, LocalDate begin, LocalDate end)
        throws ZKBioException {
        List<SkudAccessEvent> all = new ArrayList<>();
        int page = 1;
        int pageSize = 500;
        int guard = 0;
        while (guard++ < 50) {
            ZKBioTransactionsResponse response = fetchTransactionsPage(empCode, begin, end, page, pageSize);
            List<ZKBioTransaction> batch = response == null || response.data() == null
                ? List.of()
                : response.data();
            for (ZKBioTransaction row : batch) {
                SkudAccessEvent mapped = toSkudEvent(row);
                if (mapped != null) {
                    all.add(mapped);
                }
            }
            int total = response != null && response.count() != null ? response.count() : batch.size();
            if (batch.isEmpty() || page * pageSize >= total) {
                break;
            }
            page++;
        }
        return all;
    }

    private Optional<String> resolveEmpCode(String studentId) throws ZKBioException {
        int page = 1;
        int pageSize = 500;
        int guard = 0;
        while (guard++ < 200) {
            ZKBioEmployeesResponse response = fetchEmployeesPage(page, pageSize);
            List<ZKBioEmployee> batch = response == null || response.data() == null
                ? List.of()
                : response.data();
            for (ZKBioEmployee employee : batch) {
                Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode(studentId, employee);
                if (code.isPresent()) {
                    log.info(
                        "ZKBio: зачётка {} → emp_code {} (ssn/national/emp_code)",
                        studentId,
                        code.get()
                    );
                    return code;
                }
            }
            int total = response != null && response.count() != null ? response.count() : batch.size();
            if (batch.isEmpty() || page * pageSize >= total) {
                break;
            }
            page++;
        }
        return Optional.empty();
    }

    private ZKBioEmployeesResponse fetchEmployeesPage(int page, int pageSize) throws ZKBioException {
        try {
            return restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/personnel/api/employees/")
                    .queryParam("format", "json")
                    .queryParam("page", page)
                    .queryParam("page_size", pageSize)
                    .build())
                .header("Authorization", "Token " + token)
                .retrieve()
                .body(ZKBioEmployeesResponse.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 401) {
                token = null;
                authenticate();
                return fetchEmployeesPage(page, pageSize);
            }
            log.error("ZKBio employees HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ZKBioException("Не удалось получить справочник сотрудников ZKBio", e);
        } catch (ResourceAccessException e) {
            log.error("ZKBio employees I/O: {}", e.getMessage());
            throw new ZKBioException("Не удалось подключиться к ZKBio: " + rootMessage(e), e);
        }
    }

    private SkudAccessEvent toSkudEvent(ZKBioTransaction row) {
        if (row == null || row.punchTime() == null || row.punchTime().isBlank()) {
            return null;
        }
        String gate = row.terminalAlias();
        if (gate == null || gate.isBlank()) {
            gate = row.areaAlias();
        }
        return new SkudAccessEvent(row.punchTime().trim(), gate != null ? gate.trim() : null);
    }

    private ZKBioTransactionsResponse fetchTransactionsPage(
        String empCode,
        LocalDate begin,
        LocalDate end,
        int page,
        int pageSize
    ) throws ZKBioException {
        String startTime = begin.atStartOfDay().format(DAY_TIME);
        String endTime = end.atTime(23, 59, 59).format(DAY_TIME);
        try {
            return restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/iclock/api/transactions/")
                    .queryParam("emp_code", empCode)
                    .queryParam("start_time", startTime)
                    .queryParam("end_time", endTime)
                    .queryParam("page", page)
                    .queryParam("page_size", pageSize)
                    .build())
                .header("Authorization", "Token " + token)
                .retrieve()
                .body(ZKBioTransactionsResponse.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 401) {
                token = null;
                authenticate();
                try {
                    return restClient.get()
                        .uri(uriBuilder -> uriBuilder
                            .path("/iclock/api/transactions/")
                            .queryParam("emp_code", empCode)
                            .queryParam("start_time", startTime)
                            .queryParam("end_time", endTime)
                            .queryParam("page", page)
                            .queryParam("page_size", pageSize)
                            .build())
                        .header("Authorization", "Token " + token)
                        .retrieve()
                        .body(ZKBioTransactionsResponse.class);
                } catch (RestClientResponseException retry) {
                    log.error("ZKBio transactions HTTP {}: {}", retry.getStatusCode(), retry.getResponseBodyAsString());
                    throw new ZKBioException("Не удалось получить проходы из ZKBio", retry);
                }
            }
            log.error("ZKBio transactions HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ZKBioException("Не удалось получить проходы из ZKBio", e);
        } catch (ResourceAccessException e) {
            log.error("ZKBio transactions I/O: {}", e.getMessage());
            throw new ZKBioException("Не удалось подключиться к ZKBio: " + rootMessage(e), e);
        }
    }

    private void authenticate() throws ZKBioException {
        if (token != null && !token.isBlank()) {
            return;
        }
        if (properties.login() == null || properties.login().isBlank()
            || properties.password() == null || properties.password().isBlank()) {
            throw new ZKBioException("ZKBio не настроен: укажите app.zkbio.kazan.login и app.zkbio.kazan.password");
        }

        try {
            ZKBioAuthResponse body = restClient.post()
                .uri("/api-token-auth/")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "username", properties.login(),
                    "password", properties.password()
                ))
                .retrieve()
                .body(ZKBioAuthResponse.class);

            if (body == null || body.token() == null || body.token().isBlank()) {
                throw new ZKBioException("ZKBio: пустой ответ авторизации");
            }
            token = body.token();
        } catch (RestClientResponseException e) {
            log.error("ZKBio auth HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ZKBioException("Не удалось авторизоваться в ZKBio", e);
        } catch (ResourceAccessException e) {
            log.error("ZKBio auth I/O: {}", e.getMessage());
            throw new ZKBioException("Не удалось подключиться к ZKBio: " + rootMessage(e), e);
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static String rootMessage(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage();
        return message == null || message.isBlank() ? e.getMessage() : message;
    }

    private static HttpComponentsClientHttpRequestFactory buildRequestFactory(boolean trustSelfSigned) {
        if (!trustSelfSigned) {
            return new HttpComponentsClientHttpRequestFactory();
        }
        try {
            SSLContext sslContext = SSLContexts.custom()
                .loadTrustMaterial(null, TrustAllStrategy.INSTANCE)
                .build();

            CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(
                    PoolingHttpClientConnectionManagerBuilder.create()
                        .setTlsSocketStrategy(
                            new DefaultClientTlsStrategy(
                                sslContext,
                                HostnameVerificationPolicy.CLIENT,
                                NoopHostnameVerifier.INSTANCE
                            )
                        )
                        .build()
                )
                .evictExpiredConnections()
                .build();

            return new HttpComponentsClientHttpRequestFactory(httpClient);
        } catch (Exception e) {
            throw new IllegalStateException("Не удалось настроить SSL для ZKBio", e);
        }
    }
}
