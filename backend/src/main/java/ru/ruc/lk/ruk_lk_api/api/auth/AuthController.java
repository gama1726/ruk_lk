package ru.ruc.lk.ruk_lk_api.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginChallengeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.VerifyCodeRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Шаг 1: зачётка + пароль → код на почту из 1С. */
    @PostMapping("/login")
    public LoginChallengeResponse login(@RequestBody LoginRequest body, HttpSession session) {
        return authService.startLoginChallenge(body.studentId(), body.password(), session);
    }

    /** Шаг 2: код из письма → сессия. */
    @PostMapping("/verify-code")
    public MeResponse verifyCode(@RequestBody VerifyCodeRequest body, HttpSession session) {
        return authService.verifyCode(body.code(), session);
    }

    @GetMapping("/me")
    public MeResponse me(HttpSession session) {
        return authService.currentUser(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Необходимо войти в систему"));
    }

    @GetMapping("/pending-challenge")
    public LoginChallengeResponse pendingChallenge(HttpSession session) {
        return authService.pendingChallenge(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Нет незавершённого входа"));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpSession session) {
        authService.logout(session);
    }
}
