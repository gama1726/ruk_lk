package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.time.LocalDate;
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
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
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
    public Optional<MeResponse> login(String studentId) {
        try {
            OneCAuthResponse authResponse = restClient.post()
                .uri("/hs/student/auth")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new OneCAuthRequest(studentId))
                .retrieve()
                .body(OneCAuthResponse.class);

            if (authResponse == null || !authResponse.authenticated()) {
                return Optional.empty();
            }
            return Optional.of(new MeResponse(
                studentId,
                authResponse.fullName(),
                authResponse.email(),
                authResponse.phone(),
                List.of(),
                authResponse.maxUserId()
            ));
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }

    }
    @Override
    public Optional<OneCProfileResponse> fetchProfile(String studentId) {
        try {
            OneCProfileResponse profile = restClient.get()
                .uri("/hs/student/profile?studentId={id}", studentId)
                .retrieve()
                .body(OneCProfileResponse.class);

            if (profile == null || isBlank(profile.studentId()) && isBlank(profile.fullName())) {
                return Optional.empty();
            }
            return Optional.of(profile);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<OneCGradebookResponse> fetchGradebook(String studentId) {
        try {
            OneCGradebookResponse gradebook = restClient.get()
                .uri("/hs/student/gradebook?studentId={id}", studentId)
                .retrieve()
                .body(OneCGradebookResponse.class);

            if (gradebook == null || !gradebook.found()) {
                return Optional.empty();
            }
            return Optional.of(gradebook);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<OneCOrdersResponse> fetchOrders(String studentId) {
        try {
            OneCOrdersResponse orders = restClient.get()
                .uri("/hs/student/order?studentId={id}", studentId)
                .retrieve()
                .body(OneCOrdersResponse.class);

            if (orders == null || !orders.found()) {
                return Optional.empty();
            }
            return Optional.of(orders);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<OneCPortfolioResponse> fetchPortfolio(String studentId) {
        try {
            OneCPortfolioResponse portfolio = restClient.get()
                .uri("/hs/student/portfolio?studentId={id}", studentId)
                .retrieve()
                .body(OneCPortfolioResponse.class);

            // studentFound=false → студента нет; portfolioFound=false при пустом списке — валидный ответ
            if (portfolio == null || !portfolio.studentFound()) {
                return Optional.empty();
            }
            return Optional.of(portfolio);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<OneCPaymentsResponse> fetchPayments(String studentId, LocalDate asOfDate, boolean showAll) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        try {
            OneCPaymentsResponse payments = restClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/hs/student/payments")
                    .queryParam("studentId", studentId)
                    .queryParam("date", date.toString())
                    .queryParam("showAll", showAll)
                    .build())
                .retrieve()
                .body(OneCPaymentsResponse.class);

            if (payments == null || !payments.studentFound()) {
                return Optional.empty();
            }
            return Optional.of(payments);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
