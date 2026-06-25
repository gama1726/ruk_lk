package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.Optional;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.OneCAuthResponse;
 //http клиент для 1С
 

@Component
@Profile("onec")
public class HttpOneCClient implements OneCClient {
    private final RestClient restClient;
    
    public HttpOneCClient(
        @Value("${app.onec.base-url}") String baseUrl,
        @Value("${app.onec.publication-user}") String publicationUser,
        @Value("${app.onec.publication-password}") String publicationPassword) {
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)// http://localhost/universitet_masterkova1
            .defaultHeaders(headers ->
                headers.setBasicAuth(publicationUser, publicationPassword))
            .build();
    }

    @Override
    public Optional<MeResponse> login(String studentId, String password) {
        try {
            OneCAuthResponse authResponse = restClient.post()
                .uri("/hs/student/auth")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new OneCAuthRequest(studentId, password))
                .retrieve()
                .body(OneCAuthResponse.class);// парсим { "authenticated": true/false }

            //если 1с ответила false или пусто
            if (authResponse == null || !authResponse.authenticated()) {
                return Optional.empty();
            }
            //Пароль верный
            return Optional.of(new MeResponse(
                studentId,
                authResponse.fullname(),
                authResponse.email(),
                List.of()
            ));
        } catch (HttpClientErrorException e) {

            return Optional.empty();// 4XX ошибки от 1с - не вошли
        }

    }
}