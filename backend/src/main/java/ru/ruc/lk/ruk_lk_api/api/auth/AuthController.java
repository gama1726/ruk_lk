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

import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;

@RestController//класс отдает JSON
@RequestMapping("/api/auth")//общий префикс для login/logout
public class AuthController {

    private final AuthService authService;//AuthService

    //Spring подставит AuthService автоматически

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")//POST /api/auth/login

    public MeResponse login(@RequestBody LoginRequest body, HttpSession session){
        return authService.login(body.studentId(), body.password(), session);
    }

    @GetMapping("/me")//GET /api/auth/me - кто залогинен

    public MeResponse me(HttpSession session){
        return authService.currentUser(session).
        orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
             "Необходимо войти в систему"));
    }

    @PostMapping("/logout")//POST /api/auth/logout
    @ResponseStatus(HttpStatus.NO_CONTENT)//204 No Content
    public void logout(HttpSession session){
        authService.logout(session);
    }
}