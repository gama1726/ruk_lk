package ru.ruc.lk.ruk_lk_api.api.student;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.integration.start.StartBridgeClient;

@RestController
@RequestMapping("/api/student")
public class StartRedirectController {

    static final String SESSION_KEY = "STUDENT";
    /** SPA-маршрут, который снова бьёт в этот redirect после входа. */
    static final String RETURN_PATH = "/start";

    private final StartBridgeClient startBridgeClient;
    private final String loginUrl;

    public StartRedirectController(
        StartBridgeClient startBridgeClient,
        @Value("${app.frontend.login-url:}") String loginUrl
    ) {
        this.startBridgeClient = startBridgeClient;
        this.loginUrl = loginUrl == null || loginUrl.isBlank() ? "/login" : loginUrl.trim();
    }

    /**
     * Вход на start.ruc.su через сессию ЛК.
     * Без сессии — на логин с {@code next=/start}, после кода студент вернётся сюда.
     * При {@code app.start.enabled=false} — на SPA-заглушку {@code /start}.
     */
    @GetMapping("/start/redirect")
    public void redirect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!startBridgeClient.isEnabled()) {
            response.sendRedirect(RETURN_PATH);
            return;
        }
        HttpSession session = request.getSession(false);
        Object raw = session == null ? null : session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            response.sendRedirect(loginUrlWithReturn());
            return;
        }
        response.sendRedirect(startBridgeClient.callbackUrl(student));
    }

    private String loginUrlWithReturn() {
        String sep = loginUrl.contains("?") ? "&" : "?";
        return loginUrl + sep + "next=" + URLEncoder.encode(RETURN_PATH, StandardCharsets.UTF_8);
    }
}
