package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.http.HttpClient;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
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
            .requestFactory(new JdkClientHttpRequestFactory(buildHttpClient(properties.trustSelfSigned())))
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
        List<PercoStaffMember> list;
        try {
            list = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/users/staff/list")
                    .queryParam("token", token)
                    .queryParam("searchString", zachetka)
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<List<PercoStaffMember>>() {});
        } catch (RestClientResponseException e) {
            log.error("Perco search HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new PercoException("Ошибка поиска в Perco-Web", e);
        } catch (ResourceAccessException e) {
            log.error("Perco search I/O: {}", e.getMessage());
            throw new PercoException("Не удалось подключиться к Perco-Web: " + rootMessage(e), e);
        }

        if (list == null || list.isEmpty()) {
            throw new PercoException("Студент не найден в Perco-Web по зачётке " + zachetka);
        }

        if (list.size() == 1) {
            return requireStaffId(list.getFirst(), zachetka);
        }

        for (PercoStaffMember person : list) {
            if (zachetka.equals(person.resolvedTabelNumber())) {
                return requireStaffId(person, zachetka);
            }
        }

        throw new PercoException(
            "В Perco-Web найдено несколько записей, но ни одна не совпадает с зачёткой " + zachetka
        );
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
     * Как {@code curl -k} / Python {@code verify=False}: доверяем самоподписанному
     * сертификату и не сверяем hostname (у Perco часто CN без SAN на IP).
     */
    private static HttpClient buildHttpClient(boolean trustSelfSigned) {
        HttpClient.Builder builder = HttpClient.newBuilder();
        if (trustSelfSigned) {
            try {
                // Иначе JDK HttpClient сверяет IP с CN/SAN даже при trust-all TrustManager
                System.setProperty("jdk.internal.httpclient.disableHostnameVerification", "true");

                TrustManager[] trustAll = new TrustManager[] {
                    new X509TrustManager() {
                        @Override
                        public void checkClientTrusted(X509Certificate[] chain, String authType) {}

                        @Override
                        public void checkServerTrusted(X509Certificate[] chain, String authType) {}

                        @Override
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                    }
                };
                SSLContext ssl = SSLContext.getInstance("TLS");
                ssl.init(null, trustAll, new SecureRandom());
                SSLParameters sslParameters = ssl.getDefaultSSLParameters();
                sslParameters.setEndpointIdentificationAlgorithm("");
                builder.sslContext(ssl).sslParameters(sslParameters);
            } catch (Exception e) {
                throw new IllegalStateException("Не удалось настроить SSL для Perco-Web", e);
            }
        }
        return builder.build();
    }
}
