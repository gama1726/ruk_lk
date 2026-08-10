package ru.ruc.lk.ruk_lk_api.admin;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.dto.AdminLoginRequest;
import ru.ruc.lk.ruk_lk_api.admin.dto.AdminMeResponse;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService authService;

    public AdminAuthController(AdminAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AdminMeResponse login(@RequestBody AdminLoginRequest body, HttpServletRequest request) {
        return authService.login(request, body != null ? body.username() : null, body != null ? body.password() : null);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        authService.logout(session);
        return Map.of("ok", "true");
    }

    @GetMapping("/me")
    public AdminMeResponse me(HttpSession session) {
        return authService.me(session);
    }
}
