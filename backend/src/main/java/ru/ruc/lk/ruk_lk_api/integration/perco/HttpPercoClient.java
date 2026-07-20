package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;
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

@Component
@ConditionalOnProperty(name = "app.perco.enabled", havingValue = "true")
public class HttpPercoClient implements PercoClient {

    private static final Logger log = LoggerFactory.getLogger(HttpPercoClient.class);

    private final RestClient restClient;
    private final PercoProperties properties;
    private String token;

    public HttpPercoClient(PercoProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
            .baseUrl(trimTrailingSlash(properties.baseUrl()))
            .requestFactory(buildRequestFactory(properties.trustSelfSigned()))
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

        String staffId = findStaffIdByZachetka(zachetka.trim());
        byte[] resized = resizeToPercoFormat(jpeg);
        String base64 = Base64.getEncoder().encodeToString(resized);
        String photoWithPrefix = "data:image/jpeg;base64," + base64;

        updateStaffPhoto(staffId, photoWithPrefix);
        updateBiometricPhoto(staffId, base64);

        if (properties.divisionId() != null && properties.accessTemplateId() != null) {
            updateDivisionAndAccess(staffId);
        }

        log.info("Фото загружено в Perco-Web для зачётки {}, staffId={}", zachetka, staffId);
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

    private String findStaffIdByZachetka(String zachetka) throws PercoException {
        // list?searchString=номер не ищет по табельному; нужен staff/table + filters
        String filtersJson = """
            {"type":"and","rows":[{"column":"tabel_number","value":"%s"}]}
            """.formatted(escapeJson(zachetka)).trim();

        PercoStaffTableResponse table;
        try {
            table = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/staff/table")
                    .queryParam("token", token)
                    .queryParam("status", "active")
                    .queryParam("filters", filtersJson)
                    .build())
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

        return requireStaffId(exact.getFirst(), zachetka);
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
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(jpeg));
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
                            // CLIENT + Noop: без встроенной JSSE-проверки SAN (BUILTIN ломает доступ по IP)
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
            throw new IllegalStateException("Не удалось настроить SSL для Perco-Web", e);
        }
    }
}
