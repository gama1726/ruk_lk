package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.net.ssl.SSLContext;

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

import ru.ruc.lk.ruk_lk_api.imaging.ExifOrientedImages;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

@Component
@ConditionalOnProperty(name = "app.perco.enabled", havingValue = "true")
public class HttpPercoClient implements PercoClient {

    private static final Logger log = LoggerFactory.getLogger(HttpPercoClient.class);

    private static final int ACCESS_ROWS = 100;
    private static final int ACCESS_MAX_PAGES = 20;
    /**
     * С корректным filters (identifier/fio) период можно брать целиком;
     * режем на неделю только как страховка от тяжёлых отчётов.
     */
    private static final int ACCESS_CHUNK_DAYS = 7;

    private final RestClient restClient;
    private final PercoProperties properties;
    private String token;

    public HttpPercoClient(PercoProperties properties, OutboundRestClients outboundRestClients) {
        this.properties = properties;
        this.restClient = outboundRestClients.builder("perco")
            .baseUrl(trimTrailingSlash(properties.baseUrl()))
            .requestFactory(buildRequestFactory(
                properties.trustSelfSigned(),
                properties.connectTimeoutSeconds(),
                properties.readTimeoutSeconds()
            ))
            .build();
    }

    @Override
    public void uploadPassPhoto(String zachetka, byte[] jpeg) throws PercoException {
        if (zachetka == null || zachetka.isBlank()) {
            throw new PercoException("Не указан номер зачётки для Perco-Web");
        }
        if (jpeg == null || jpeg.length == 0) {
            throw new PercoException("Пустой файл фото");
        }

        authenticate();

        PercoStaffMember staff = findStaffByZachetka(zachetka.trim());
        String staffId = requireStaffId(staff, zachetka.trim());
        byte[] resized = resizeToPercoFormat(jpeg);
        String base64 = Base64.getEncoder().encodeToString(resized);
        String photoWithPrefix = "data:image/jpeg;base64," + base64;

        updateStaffPhoto(staffId, photoWithPrefix);
        updateBiometricPhoto(staffId, base64);

        maybeUpdateDivisionAndAccess(staff, staffId);

        log.info("Фото загружено в Perco-Web для зачётки {}, staffId={}", zachetka, staffId);
    }

    @Override
    public List<PercoAccessEvent> fetchAccessEvents(String zachetka, LocalDate from, LocalDate to)
        throws PercoException {
        if (zachetka == null || zachetka.isBlank()) {
            throw new PercoException("Не указан номер зачётки для Perco-Web");
        }
        if (from == null || to == null) {
            throw new PercoException("Укажите период проходов");
        }
        LocalDate begin = from.isBefore(to) ? from : to;
        LocalDate end = from.isBefore(to) ? to : from;
        String tabel = zachetka.trim();

        authenticate();

        // 1) Найти сотрудника по табельному (filters.tabel_number работает только в staff/table).
        PercoStaffMember staff = findStaffByZachetka(tabel);
        String staffId = requireStaffId(staff, tabel);
        List<String> cards = staff.resolvedIdentifiers();
        if (cards.isEmpty()) {
            // В table иногда нет карт — догружаем карточку.
            staff = fetchStaffById(staffId);
            cards = staff.resolvedIdentifiers();
        }

        // 2) accessReports: documented filters — identifier / fio (НЕ tabel_number, НЕ user_id).
        //    См. документацию Perco-Web /accessReports/events (колонки filters).
        String filters;
        try {
            filters = buildAccessReportFilters(staff, cards);
        } catch (IllegalArgumentException e) {
            throw new PercoException(
                "У сотрудника в Perco-Web нет карты и ФИО для фильтра проходов (зачётка " + tabel + ")",
                e
            );
        }
        String searchHint = !cards.isEmpty() ? cards.getFirst() : staff.resolvedFio();

        List<PercoAccessEvent> all = new ArrayList<>();
        for (LocalDate chunkBegin = begin; !chunkBegin.isAfter(end); ) {
            LocalDate chunkEnd = chunkBegin.plusDays(ACCESS_CHUNK_DAYS - 1);
            if (chunkEnd.isAfter(end)) {
                chunkEnd = end;
            }
            all.addAll(fetchAccessEventsForStaffChunk(
                staffId,
                tabel,
                filters,
                searchHint,
                chunkBegin,
                chunkEnd
            ));
            chunkBegin = chunkEnd.plusDays(1);
        }

        log.info(
            "Perco проходы: зачётка={}, staffId={}, cards={}, {}..{}, событий={}",
            tabel,
            staffId,
            cards.size(),
            begin,
            end,
            all.size()
        );
        return all;
    }

    /**
     * Фильтр отчёта проходов по документации Perco-Web:
     * column ∈ event_date, fio*, identifier*, division, position, access_template,
     * supporting_document*, supporting_document_number*, in, out, accompanying_name*
     * (* — поиск «содержит»).
     */
    private static String buildAccessReportFilters(PercoStaffMember staff, List<String> cards) {
        if (cards != null && !cards.isEmpty()) {
            StringBuilder rows = new StringBuilder();
            for (int i = 0; i < cards.size(); i++) {
                if (i > 0) {
                    rows.append(',');
                }
                rows.append("{\"column\":\"identifier\",\"value\":\"")
                    .append(escapeJson(cards.get(i)))
                    .append("\"}");
            }
            // Несколько карт — OR.
            return "{\"type\":\"or\",\"rows\":[" + rows + "]}";
        }
        String fio = staff.resolvedFio();
        if (fio != null && !fio.isBlank()) {
            return "{\"type\":\"and\",\"rows\":[{\"column\":\"fio\",\"value\":\"%s\"}]}"
                .formatted(escapeJson(fio));
        }
        throw new IllegalArgumentException("Нет карты и ФИО для фильтра accessReports");
    }

    private List<PercoAccessEvent> fetchAccessEventsForStaffChunk(
        String staffId,
        String tabel,
        String filters,
        String searchHint,
        LocalDate begin,
        LocalDate end
    ) throws PercoException {
        List<PercoAccessEvent> all = new ArrayList<>();

        for (int page = 0; page < ACCESS_MAX_PAGES; page++) {
            PercoAccessEventsResponse response = fetchAccessEventsPage(
                filters,
                searchHint,
                begin,
                end,
                page,
                ACCESS_ROWS
            );
            List<PercoAccessEvent> batch = response == null || response.rows() == null
                ? List.of()
                : response.rows();
            if (batch.isEmpty()) {
                break;
            }

            int matched = 0;
            for (PercoAccessEvent event : batch) {
                if (matchesStaffEvent(event, staffId, tabel)) {
                    all.add(event);
                    matched++;
                }
            }

            int total = response.total() != null ? response.total() : batch.size();
            // Фильтр не сработал — Perco отдал чужой объём; не листаем дальше.
            if (matched == 0 && total > batch.size() * 2) {
                log.warn(
                    "Perco accessReports: фильтр не сузил выборку (total={}, matched={}/{}), page={}, {}..{}",
                    total,
                    matched,
                    batch.size(),
                    page,
                    begin,
                    end
                );
                break;
            }
            if (matched == 0 && page == 0 && total > 200) {
                log.warn(
                    "Perco accessReports: слишком широкий ответ (total={}), staffId={}, {}..{}",
                    total,
                    staffId,
                    begin,
                    end
                );
                break;
            }

            int loaded = (page + 1) * ACCESS_ROWS;
            if (loaded >= total) {
                break;
            }
        }
        return all;
    }

    private static boolean matchesStaffEvent(PercoAccessEvent event, String staffId, String tabel) {
        if (event.userId() != null) {
            String eventUserId = String.valueOf(event.userId()).trim();
            if (!eventUserId.isEmpty() && !"null".equals(eventUserId) && staffId.equals(eventUserId)) {
                return true;
            }
        }
        String eventTabel = event.resolvedTabelNumber();
        return eventTabel != null && tabel.equalsIgnoreCase(eventTabel);
    }

    private PercoAccessEventsResponse fetchAccessEventsPage(
        String filtersJson,
        String searchHint,
        LocalDate begin,
        LocalDate end,
        int page,
        int rows
    ) throws PercoException {
        try {
            return requestAccessEventsPageFiltered(filtersJson, begin, end, page, rows);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 401) {
                token = null;
                authenticate();
                try {
                    return requestAccessEventsPageFiltered(filtersJson, begin, end, page, rows);
                } catch (RestClientResponseException retry) {
                    log.error(
                        "Perco accessReports HTTP {}: {}",
                        retry.getStatusCode(),
                        retry.getResponseBodyAsString()
                    );
                    throw new PercoException(
                        "Не удалось получить проходы из Perco-Web (HTTP " + retry.getStatusCode().value() + ")",
                        retry
                    );
                }
            }
            // filters отвергнут — узкий searchString по карте/ФИО (не по табельному!).
            int code = e.getStatusCode().value();
            if (code >= 400 && code < 500 && searchHint != null && !searchHint.isBlank()) {
                log.warn(
                    "Perco accessReports filters HTTP {}, fallback searchString: {}",
                    code,
                    e.getResponseBodyAsString()
                );
                try {
                    return requestAccessEventsPageSearch(searchHint, begin, end, page, rows);
                } catch (RestClientResponseException searchEx) {
                    log.error(
                        "Perco accessReports searchString HTTP {}: {}",
                        searchEx.getStatusCode(),
                        searchEx.getResponseBodyAsString()
                    );
                    throw new PercoException(
                        "Не удалось получить проходы из Perco-Web (HTTP "
                            + searchEx.getStatusCode().value() + ")",
                        searchEx
                    );
                }
            }
            log.error("Perco accessReports HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException(
                "Не удалось получить проходы из Perco-Web (HTTP " + code + ")",
                e
            );
        } catch (ResourceAccessException e) {
            log.error("Perco accessReports I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    /**
     * Отчёт проходов с {@code filters} по identifier или fio (документация Perco-Web).
     */
    private PercoAccessEventsResponse requestAccessEventsPageFiltered(
        String filtersJson,
        LocalDate begin,
        LocalDate end,
        int page,
        int rows
    ) {
        // filters JSON содержит { } — через UriBuilder Spring воспринимает это как URI-шаблон.
        return restClient.get()
            .uri(
                "/api/accessReports/events"
                    + "?token={token}"
                    + "&group=staff"
                    + "&dateBegin={dateBegin}"
                    + "&dateEnd={dateEnd}"
                    + "&filters={filters}"
                    + "&page={page}"
                    + "&rows={rows}"
                    + "&sidx=time_label"
                    + "&sord=asc",
                token,
                begin.toString(),
                end.toString(),
                filtersJson,
                page,
                rows
            )
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(PercoAccessEventsResponse.class);
    }

    private PercoAccessEventsResponse requestAccessEventsPageSearch(
        String searchHint,
        LocalDate begin,
        LocalDate end,
        int page,
        int rows
    ) {
        return restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/accessReports/events")
                .queryParam("token", token)
                .queryParam("group", "staff")
                .queryParam("dateBegin", begin.toString())
                .queryParam("dateEnd", end.toString())
                .queryParam("searchString", searchHint)
                .queryParam("page", page)
                .queryParam("rows", rows)
                .queryParam("sidx", "time_label")
                .queryParam("sord", "asc")
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(PercoAccessEventsResponse.class);
    }

    private static String tabelNumberFilter(String tabel) {
        return "{\"type\":\"and\",\"rows\":[{\"column\":\"tabel_number\",\"value\":\"%s\"}]}"
            .formatted(escapeJson(tabel));
    }

    private PercoStaffMember fetchStaffById(String staffId) throws PercoException {
        try {
            PercoStaffMember staff = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/staff/{id}")
                    .queryParam("token", token)
                    .build(staffId))
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(PercoStaffMember.class);
            if (staff == null) {
                throw new PercoException("Perco-Web: пустая карточка сотрудника id=" + staffId);
            }
            return staff;
        } catch (RestClientResponseException e) {
            log.error("Perco staff/{id} HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Не удалось получить карточку сотрудника в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco staff/{id} I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    private void authenticate() throws PercoException {
        if (token != null && !token.isBlank()) {
            return;
        }
        if (properties.login() == null || properties.login().isBlank()
            || properties.password() == null || properties.password().isBlank()) {
            throw new PercoException("Perco-Web не настроен: укажите app.perco.login и app.perco.password");
        }

        try {
            PercoAuthResponse body = restClient.post()
                .uri("/api/system/auth")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "login", properties.login(),
                    "password", properties.password()
                ))
                .retrieve()
                .body(PercoAuthResponse.class);

            if (body == null || body.token() == null || body.token().isBlank()) {
                throw new PercoException("Perco-Web: пустой ответ авторизации");
            }
            token = body.token();
        } catch (RestClientResponseException e) {
            log.error("Perco auth HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Не удалось авторизоваться в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco auth I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    private PercoStaffMember findStaffByZachetka(String zachetka) throws PercoException {
        // list?searchString=номер не ищет по табельному; нужен staff/table + filters
        String filtersJson = tabelNumberFilter(zachetka);

        PercoStaffTableResponse table;
        try {
            // filters JSON содержит { } — нельзя класть его в queryParam через UriBuilder
            // (Spring воспринимает это как URI-шаблон). Значение передаём через {filters}.
            table = restClient.get()
                .uri(
                    "/api/users/staff/table?token={token}&status=active&filters={filters}",
                    token,
                    filtersJson
                )
                .retrieve()
                .body(PercoStaffTableResponse.class);
        } catch (RestClientResponseException e) {
            log.error("Perco table search HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Ошибка поиска в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco table search I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }

        List<PercoStaffMember> rows = table == null || table.rows() == null ? List.of() : table.rows();
        if (rows.isEmpty()) {
            throw new PercoException("Студент не найден в Perco-Web по зачётке " + zachetka);
        }

        // filters ищет по вхождению — оставляем только точное совпадение табельного
        List<PercoStaffMember> exact = rows.stream()
            .filter(person -> zachetka.equals(person.resolvedTabelNumber()))
            .toList();

        if (exact.isEmpty()) {
            throw new PercoException("Студент не найден в Perco-Web по зачётке " + zachetka);
        }
        if (exact.size() > 1) {
            throw new PercoException(
                "В Perco-Web найдено несколько записей с табельным номером " + zachetka
            );
        }

        return exact.getFirst();
    }

    private static String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"");
    }

    private void updateStaffPhoto(String staffId, String photoWithPrefix) throws PercoException {
        postStaffUpdate(staffId, Map.of("photo", photoWithPrefix), "фото профиля");
    }

    private void updateBiometricPhoto(String staffId, String base64) throws PercoException {
        try {
            restClient.put()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/bio/{id}")
                    .queryParam("token", token)
                    .queryParam("type", 2)
                    .build(staffId))
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "number", 0,
                    "templateType", 3,
                    "template", base64,
                    "image", base64,
                    "name", "Лицо #1"
                ))
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("Perco bio HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Не удалось обновить биометрию в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco bio I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    /**
     * Отдел/шаблон — только если в карточке ещё пусто. Ошибка этого шага
     * не откатывает уже загруженное фото.
     */
    private void maybeUpdateDivisionAndAccess(PercoStaffMember staff, String staffId) {
        if (properties.divisionId() == null || properties.accessTemplateId() == null) {
            return;
        }
        if (staff.hasDivisionOrAccess()) {
            log.info(
                "Perco: у staffId={} отдел/шаблон уже заданы — пропускаем обновление",
                staffId
            );
            return;
        }
        try {
            updateDivisionAndAccess(staffId);
        } catch (PercoException e) {
            log.warn(
                "Perco: не удалось обновить отдел/шаблон для staffId={} (фото уже загружено): {}",
                staffId,
                e.getMessage()
            );
        }
    }

    private void updateDivisionAndAccess(String staffId) throws PercoException {
        postStaffUpdate(
            staffId,
            Map.of(
                "division", properties.divisionId(),
                "access_template", properties.accessTemplateId()
            ),
            "отдел и шаблон доступа"
        );
    }

    private void postStaffUpdate(String staffId, Map<String, Object> body, String what) throws PercoException {
        try {
            restClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/staff/{id}")
                    .queryParam("token", token)
                    .build(staffId))
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("Perco staff update ({}) HTTP {}: {}", what, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Не удалось обновить " + what + " в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco staff update ({}) I/O: {}", what, e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    private static String requireStaffId(PercoStaffMember person, String zachetka) throws PercoException {
        String id = person.resolvedId();
        if (id == null || id.isBlank()) {
            throw new PercoException("Perco-Web: у записи для зачётки " + zachetka + " нет id");
        }
        return id;
    }

    byte[] resizeToPercoFormat(byte[] jpeg) throws PercoException {
        try {
            BufferedImage image = ExifOrientedImages.read(jpeg);
            if (image == null) {
                throw new PercoException("Не удалось прочитать JPEG для Perco-Web");
            }

            int targetW = properties.photoWidth();
            int targetH = properties.photoHeight();
            BufferedImage rgb = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, targetW, targetH);
            Image scaled = image.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH);
            g.drawImage(scaled, 0, 0, null);
            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(rgb, "jpg", out)) {
                throw new PercoException("Не удалось подготовить JPEG для Perco-Web");
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new PercoException("Ошибка обработки фото для Perco-Web", e);
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

    /**
     * Как {@code curl -k} / Python {@code verify=False}: Apache HttpClient + TrustAll + NoopHostnameVerifier.
     * JDK HttpClient этого не умеет надёжно (SAN/IP).
     */
    private static HttpComponentsClientHttpRequestFactory buildRequestFactory(
        boolean trustSelfSigned,
        int connectTimeoutSeconds,
        int readTimeoutSeconds
    ) {
        // Таймауты на Apache HttpClient 5 — API factory.setConnectTimeout(Duration) в этой версии Spring нет.
        var requestConfig = org.apache.hc.client5.http.config.RequestConfig.custom()
            .setConnectionRequestTimeout(org.apache.hc.core5.util.Timeout.ofSeconds(connectTimeoutSeconds))
            .setResponseTimeout(org.apache.hc.core5.util.Timeout.ofSeconds(readTimeoutSeconds))
            .build();

        try {
            var clientBuilder = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .evictExpiredConnections();

            if (trustSelfSigned) {
                SSLContext sslContext = SSLContexts.custom()
                    .loadTrustMaterial(null, TrustAllStrategy.INSTANCE)
                    .build();
                clientBuilder.setConnectionManager(
                    PoolingHttpClientConnectionManagerBuilder.create()
                        .setTlsSocketStrategy(
                            // CLIENT + Noop: без встроенной JSSE-проверки SAN (BUILTIN ломает доступ по IP)
                            new DefaultClientTlsStrategy(
                                sslContext,
                                HostnameVerificationPolicy.CLIENT,
                                NoopHostnameVerifier.INSTANCE
                            )
                        )
                        .build()
                );
            }

            return new HttpComponentsClientHttpRequestFactory(clientBuilder.build());
        } catch (Exception e) {
            throw new IllegalStateException("Не удалось настроить HTTP-клиент для Perco-Web", e);
        }
    }
}
