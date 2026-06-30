package ru.ruc.lk.ruk_lk_api.passphoto;

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
        if (token == null || !expectedToken.equals(token.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Неверный токен администратора");
        }
    }
}
