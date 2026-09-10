package ru.ruc.lk.ruk_lk_api.metrics;

import java.io.IOException;
import java.net.URI;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * RestClient с учётом исходящих вызовов в {@link OutboundLoadMetrics}.
 */
@Component
public class OutboundRestClients {

    private final OutboundLoadMetrics metrics;

    public OutboundRestClients(OutboundLoadMetrics metrics) {
        this.metrics = metrics;
    }

    public RestClient.Builder builder(String service) {
        return RestClient.builder().requestInterceptor(interceptor(service));
    }

    public ClientHttpRequestInterceptor interceptor(String service) {
        String svc = service == null || service.isBlank() ? "unknown" : service.trim().toLowerCase();
        return (HttpRequest request, byte[] body, ClientHttpRequestExecution execution) -> {
            String httpOp = operationKey(request);
            String operation = OutboundOperationContext.peekOr(httpOp);
            metrics.begin(svc, operation);
            long started = System.nanoTime();
            try {
                ClientHttpResponse response = execution.execute(request, body);
                int status = response.getStatusCode().value();
                metrics.end(svc, operation, status, elapsedMs(started), httpOp);
                return response;
            } catch (IOException e) {
                metrics.end(svc, operation, 599, elapsedMs(started), "io: " + shortMsg(e));
                throw e;
            }
        };
    }

    private static String operationKey(HttpRequest request) {
        String method = request.getMethod() == null ? "GET" : request.getMethod().name();
        URI uri = request.getURI();
        String path = uri == null ? "/" : uri.getRawPath();
        return method + " " + ApiLoadMetrics.normalize(path);
    }

    private static long elapsedMs(long startedNanos) {
        return Math.max(0L, (System.nanoTime() - startedNanos) / 1_000_000L);
    }

    private static String shortMsg(Exception e) {
        String m = e.getMessage();
        if (m == null || m.isBlank()) {
            return e.getClass().getSimpleName();
        }
        return m.length() > 160 ? m.substring(0, 160) : m;
    }
}
