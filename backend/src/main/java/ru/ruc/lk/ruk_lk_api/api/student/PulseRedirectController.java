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
import ru.ruc.lk.ruk_lk_api.integration.pulse.PulseBridgeClient;

@RestController
@RequestMapping("/api/student")
public class PulseRedirectController {

    static final String SESSION_KEY = "STUDENT";
    /** SPA-маршрут электронного журнала — снова бьёт в redirect после входа. */
    static final String RETURN_PATH = "/e-journal";

    private final PulseBridgeClient pulseBridgeClient;
    private final String loginUrl;

    public PulseRedirectController(
        PulseBridgeClient pulseBridgeClient,
        @Value("${app.frontend.login-url:}") String loginUrl
    ) {
        this.pulseBridgeClient = pulseBridgeClient;
        this.loginUrl = loginUrl == null || loginUrl.isBlank() ? "/login" : loginUrl.trim();
    }

    /**
     * Вход на pulse.ruc.su через сессию ЛК.
     * Без сессии — на логин с {@code next=/e-journal}.
     * При {@code app.pulse.enabled=false} — на SPA {@code /e-journal}.
     */
    @GetMapping("/pulse/redirect")
    public void redirect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!pulseBridgeClient.isEnabled()) {
            response.sendRedirect(RETURN_PATH);
            return;
        }
        HttpSession session = request.getSession(false);
        Object raw = session == null ? null : session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            response.sendRedirect(loginUrlWithReturn());
            return;
        }
        response.sendRedirect(pulseBridgeClient.callbackUrl(student));
    }

    private String loginUrlWithReturn() {
        String sep = loginUrl.contains("?") ? "&" : "?";
        return loginUrl + sep + "next=" + URLEncoder.encode(RETURN_PATH, StandardCharsets.UTF_8);
    }
}
