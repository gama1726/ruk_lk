package ru.ruc.lk.ruk_lk_api.api.student;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.integration.esports.EsportsBridgeClient;

@RestController
@RequestMapping("/api/student")
public class EsportsRedirectController {

    static final String SESSION_KEY = "STUDENT";

    private final EsportsBridgeClient esportsBridgeClient;
    private final String loginUrl;

    public EsportsRedirectController(
        EsportsBridgeClient esportsBridgeClient,
        @Value("${app.frontend.login-url}") String loginUrl
    ) {
        this.esportsBridgeClient = esportsBridgeClient;
        this.loginUrl = loginUrl;
    }

    @GetMapping("/esports/redirect")
    public void redirect(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        Object raw = session == null ? null : session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            response.sendRedirect(loginUrl);
            return;
        }
        response.sendRedirect(esportsBridgeClient.callbackUrl(student));
    }
}
