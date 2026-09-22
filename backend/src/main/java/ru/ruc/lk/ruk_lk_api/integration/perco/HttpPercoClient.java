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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

import tools.jackson.databind.JsonNode;

import ru.ruc.lk.ruk_lk_api.imaging.ExifOrientedImages;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundRestClients;

@Component
@ConditionalOnProperty(name = "app.perco.enabled", havingValue = "true")
public class HttpPercoClient implements PercoClient {

    private static final Logger log = LoggerFactory.getLogger(HttpPercoClient.class);

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
    public void uploadPassPhoto(String zachetka, byte[] jpeg, String fullName) throws PercoException {
        if (zachetka == null || zachetka.isBlank()) {
            throw new PercoException("Не указан номер зачетной книжки для Perco-Web");
        }
        if (jpeg == null || jpeg.length == 0) {
            throw new PercoException("Пустой файл фото");
        }

        authenticate();

        String tabel = zachetka.trim();
        Optional<PercoStaffMember> existing = findStaffByZachetka(tabel);
        PercoStaffMember staff;
        String staffId;
        if (existing.isPresent()) {
            staff = existing.get();
            staffId = requireStaffId(staff, tabel);
        } else if (properties.createIfMissing()) {
            staffId = createStaff(tabel, fullName);
            staff = null;
            log.info("Perco: создана карточка staffId={} для зачетной книжки {}", staffId, tabel);
        } else {
            throw new PercoException("Студент не найден в Perco-Web по зачетной книжке " + tabel);
        }

        byte[] resized = resizeToPercoFormat(jpeg);
        String base64 = Base64.getEncoder().encodeToString(resized);
        String photoWithPrefix = "data:image/jpeg;base64," + base64;

        updateStaffPhoto(staffId, photoWithPrefix);
        updateBiometricPhoto(staffId, base64);

        if (staff != null) {
            maybeUpdateDivisionAndAccess(staff, staffId);
        }

        log.info("Фото загружено в Perco-Web для зачетной книжки {}, staffId={}", zachetka, staffId);
    }

    @Override
    public List<PercoAccessEvent> fetchAccessEvents(String zachetka, LocalDate from, LocalDate to)
        throws PercoException {
        if (zachetka == null || zachetka.isBlank()) {
            throw new PercoException("Не указан номер зачетной книжки для Perco-Web");
        }
        if (from == null || to == null) {
            throw new PercoException("Укажите период проходов");
        }
        LocalDate begin = from.isBefore(to) ? from : to;
        LocalDate end = from.isBefore(to) ? to : from;
        String tabel = zachetka.trim();

        authenticate();

        // УРВ: /taReports/eventsTable — один сотрудник + один день (не accessReports!).
        PercoStaffMember staff = findStaffByZachetka(tabel)
            .orElseThrow(() -> new PercoException("Студент не найден в Perco-Web по зачетной книжке " + tabel));
        String staffId = requireStaffId(staff, tabel);

        List<PercoAccessEvent> all = new ArrayList<>();
        for (LocalDate day = begin; !day.isAfter(end); day = day.plusDays(1)) {
            all.addAll(fetchTaEventsForDay(staffId, day));
        }

        log.info(
            "Perco УРВ проходы: зачетная книжка={}, staffId={}, {}..{}, событий={}",
            tabel,
            staffId,
            begin,
            end,
            all.size()
        );
        return all;
    }

    @Override
    public Map<String, List<PercoAccessEvent>> fetchAccessEventsByTabel(LocalDate from, LocalDate to)
        throws PercoException {
        if (from == null || to == null) {
            throw new PercoException("Укажите период проходов");
        }
        LocalDate begin = from.isBefore(to) ? from : to;
        LocalDate end = from.isBefore(to) ? to : from;
        authenticate();

        Map<String, List<PercoAccessEvent>> byTabel = new java.util.LinkedHashMap<>();
        int page = 1;
        int pageSize = 500;
        int guard = 0;
        while (guard++ < 40) {
            JsonNode body;
            try {
                body = requestAccessReportPage(begin, end, page, pageSize);
            } catch (RestClientResponseException e) {
                if (e.getStatusCode().value() == 401) {
                    token = null;
                    authenticate();
                    body = requestAccessReportPage(begin, end, page, pageSize);
                } else if (e.getStatusCode().value() == 403 || e.getStatusCode().value() == 404) {
                    log.warn(
                        "Perco accessReports/events недоступен (HTTP {}): массовый отчёт пойдёт поштучно",
                        e.getStatusCode().value()
                    );
                    return Map.of();
                } else {
                    log.error("Perco accessReports/events HTTP {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
                    return Map.of();
                }
            } catch (ResourceAccessException e) {
                log.warn("Perco accessReports/events I/O: {}", e.getMessage());
                return Map.of();
            }

            JsonNode rows = body == null ? null : body.get("rows");
            if (rows == null || !rows.isArray() || rows.isEmpty()) {
                break;
            }
            for (JsonNode row : rows) {
                String tabel = extractTabel(row);
                PercoAccessEvent event = mapAccessReportRow(row);
                if (tabel == null || event == null || event.resolvedTimeLabel() == null) {
                    continue;
                }
                byTabel.computeIfAbsent(tabel, ignored -> new ArrayList<>()).add(event);
            }
            int totalPages = intOrZero(body.get("total"));
            if (totalPages <= 0) {
                int records = intOrZero(body.get("records"));
                totalPages = records <= 0 ? page : (int) Math.ceil(records / (double) pageSize);
            }
            if (page >= totalPages || rows.size() < pageSize) {
                break;
            }
            page++;
        }
        log.info(
            "Perco accessReports/events: {}..{}, сотрудников с проходами={}",
            begin,
            end,
            byTabel.size()
        );
        return byTabel;
    }

    private JsonNode requestAccessReportPage(LocalDate begin, LocalDate end, int page, int rows) {
        return restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/accessReports/events")
                .queryParam("token", token)
                .queryParam("dateBegin", begin.toString())
                .queryParam("dateEnd", end.toString())
                .queryParam("group", "staff")
                .queryParam("page", page)
                .queryParam("rows", rows)
                .queryParam("sord", "ASC")
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(JsonNode.class);
    }

    private static String extractTabel(JsonNode row) {
        if (row == null || !row.isObject()) {
            return null;
        }
        for (String field : List.of(
            "tabel_number",
            "tabelNumber",
            "tab_number",
            "tabNumber",
            "tabel",
            "personnel_number",
            "user_tabel"
        )) {
            String value = text(row, field);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        JsonNode user = row.get("user");
        if (user != null && user.isObject()) {
            String nested = extractTabel(user);
            if (nested != null) {
                return nested;
            }
        }
        return null;
    }

    private static PercoAccessEvent mapAccessReportRow(JsonNode row) {
        if (row == null || !row.isObject()) {
            return null;
        }
        String time = firstText(row, "time_label", "datetime", "date_time", "event_time", "time", "event_date");
        String zoneExit = firstText(row, "event_exit", "out_name", "zone_exit", "out");
        String zoneEnter = firstText(row, "event_enter", "in_name", "zone_enter", "in");
        if ((zoneExit == null || zoneExit.isBlank()) && row.get("out") != null && row.get("out").isNumber()) {
            zoneExit = row.get("out").asText();
        }
        if ((zoneEnter == null || zoneEnter.isBlank()) && row.get("in") != null && row.get("in").isNumber()) {
            zoneEnter = row.get("in").asText();
        }
        return new PercoAccessEvent(numberOrText(row, "id"), time, zoneExit, zoneEnter);
    }

    private static String firstText(JsonNode row, String... fields) {
        for (String field : fields) {
            String value = text(row, field);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static int intOrZero(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return 0;
        }
        return node.asInt();
    }

    /**
     * {@code GET /api/taReports/eventsTable} — лицензия УРВ, фильтр по ID пользователя и дате.
     * type=false: все события, не только учитываемые в расчёте УРВ.
     */
    private List<PercoAccessEvent> fetchTaEventsForDay(String staffId, LocalDate date) throws PercoException {
        try {
            return requestTaEventsTable(staffId, date);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 401) {
                token = null;
                authenticate();
                try {
                    return requestTaEventsTable(staffId, date);
                } catch (RestClientResponseException retry) {
                    throw taEventsException(retry);
                }
            }
            throw taEventsException(e);
        } catch (ResourceAccessException e) {
            log.error("Perco taReports/eventsTable I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    private List<PercoAccessEvent> requestTaEventsTable(String staffId, LocalDate date) {
        JsonNode body = restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/api/taReports/eventsTable")
                .queryParam("token", token)
                .queryParam("id", staffId)
                .queryParam("date", date.toString())
                .queryParam("type", "false")
                .build())
            .header("Authorization", "Bearer " + token)
            .retrieve()
            .body(JsonNode.class);
        return parseTaEventRows(body, date);
    }

    private PercoException taEventsException(RestClientResponseException e) {
        int code = e.getStatusCode().value();
        log.error("Perco taReports/eventsTable HTTP {}: {}", code, e.getResponseBodyAsString());
        if (code == 403) {
            return new PercoException(
                "Нет доступа к УРВ Perco-Web (нужно право timeAttendanceReportsEventsTableGET)",
                e
            );
        }
        return new PercoException(
            "Не удалось получить проходы из Perco-Web УРВ (HTTP " + code + ")",
            e
        );
    }

    private List<PercoAccessEvent> parseTaEventRows(JsonNode body, LocalDate date) {
        if (body == null || body.isNull()) {
            return List.of();
        }
        JsonNode rows = body.get("rows");
        if (rows == null || !rows.isArray() || rows.isEmpty()) {
            return List.of();
        }

        List<PercoAccessEvent> events = new ArrayList<>(rows.size());
        for (JsonNode row : rows) {
            PercoAccessEvent event = mapTaRow(row, date);
            if (event != null && event.resolvedTimeLabel() != null) {
                events.add(event);
            }
        }
        return events;
    }

    /**
     * УРВ {@code /taReports/eventsTable}: time_label, event_exit, event_enter, is_enter, calculate.
     */
    private static PercoAccessEvent mapTaRow(JsonNode row, LocalDate date) {
        if (row == null || row.isNull() || !row.isObject()) {
            return null;
        }
        String time = text(row, "time_label");
        if (time != null && !time.contains("-") && !time.contains(".") && date != null) {
            time = date + " " + time.trim();
        }
        return new PercoAccessEvent(
            numberOrText(row, "id"),
            time,
            text(row, "event_exit"),
            text(row, "event_enter")
        );
    }

    private static String text(JsonNode row, String field) {
        JsonNode node = row.get(field);
        if (node == null || node.isNull() || !node.isValueNode()) {
            return null;
        }
        String value = node.asText();
        if (value == null) {
            return null;
        }
        value = value.trim();
        return value.isEmpty() || "null".equalsIgnoreCase(value) ? null : value;
    }

    private static Object numberOrText(JsonNode row, String field) {
        JsonNode node = row.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.numberValue();
        }
        return text(row, field);
    }

    private static String tabelNumberFilter(String tabel) {
        return "{\"type\":\"and\",\"rows\":[{\"column\":\"tabel_number\",\"value\":\"%s\"}]}"
            .formatted(escapeJson(tabel));
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

    private Optional<PercoStaffMember> findStaffByZachetka(String zachetka) throws PercoException {
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
            return Optional.empty();
        }

        // filters ищет по вхождению — оставляем только точное совпадение табельного
        List<PercoStaffMember> exact = rows.stream()
            .filter(person -> zachetka.equals(person.resolvedTabelNumber()))
            .toList();

        if (exact.isEmpty()) {
            return Optional.empty();
        }
        if (exact.size() > 1) {
            throw new PercoException(
                "В Perco-Web найдено несколько записей с табельным номером " + zachetka
            );
        }

        return Optional.of(exact.getFirst());
    }

    /**
     * Создание карточки: {@code PUT /api/users/staff} (офики PERCo api_examples).
     */
    private String createStaff(String tabelNumber, String fullName) throws PercoException {
        if (fullName == null || fullName.isBlank()) {
            throw new PercoException(
                "Студент не найден в Perco-Web, а для создания карточки нет ФИО"
            );
        }
        FioParts fio = splitFio(fullName);
        if (fio.lastName().isBlank()) {
            throw new PercoException("Не удалось разобрать ФИО для создания карточки в Perco-Web");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("last_name", fio.lastName());
        body.put("first_name", fio.firstName());
        if (!fio.middleName().isBlank()) {
            body.put("middle_name", fio.middleName());
        }
        body.put("tabel_number", tabelNumber);
        body.put("hiring_date", LocalDate.now().toString());
        if (properties.divisionId() != null) {
            body.put("division", properties.divisionId());
        }
        if (properties.accessTemplateId() != null) {
            body.put("access_template", List.of(properties.accessTemplateId()));
        }
        if (properties.positionId() != null) {
            body.put("position", properties.positionId());
        }
        if (properties.workScheduleId() != null) {
            body.put("work_schedule", properties.workScheduleId());
        }

        try {
            PercoStaffCreateResponse response = restClient.put()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/staff")
                    .queryParam("token", token)
                    .build())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(PercoStaffCreateResponse.class);
            if (response == null || response.id() == null) {
                String err = response != null && response.error() != null ? response.error() : "пустой ответ";
                throw new PercoException("Не удалось создать карточку в Perco-Web: " + err);
            }
            return String.valueOf(response.id());
        } catch (PercoException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Perco create staff HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException(
                "Не удалось создать карточку в Perco-Web (HTTP " + e.getStatusCode().value() + ")",
                e
            );
        } catch (ResourceAccessException e) {
            log.error("Perco create staff I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }
    }

    /** Фамилия Имя Отчество → поля Perco. */
    static FioParts splitFio(String fullName) {
        String normalized = fullName == null ? "" : fullName.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            return new FioParts("", "", "");
        }
        String[] parts = normalized.split(" ");
        String last = parts[0];
        String first = parts.length > 1 ? parts[1] : "";
        String middle = parts.length > 2 ? String.join(" ", List.of(parts).subList(2, parts.length)) : "";
        return new FioParts(last, first, middle);
    }

    record FioParts(String lastName, String firstName, String middleName) {}

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
            throw new PercoException("Perco-Web: у записи для зачетной книжки " + zachetka + " нет id");
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
