package ru.ruc.lk.ruk_lk_api.passphoto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AdminTokenVerifier {

    private final String expectedToken;

    public AdminTokenVerifier(@Value("${app.admin.api-token:}") String expectedToken) {
        this.expectedToken = expectedToken == null ? "" : expectedToken.trim();
    }

    public void verify(String token) {
        if (expectedToken.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Админка не настроена: укажите app.admin.api-token"
            );
        }
        String provided = token == null ? "" : token.trim();
        byte[] expected = expectedToken.getBytes(StandardCharsets.UTF_8);
        byte[] actual = provided.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Неверный токен администратора");
        }
    }
}
