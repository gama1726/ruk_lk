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

import ru.ruc.lk.ruk_lk_api.api.auth.dto.AuthChannelsDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.IdentifyRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.IdentifyResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.LoginChallengeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MaxBindLinkResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.SendCodeRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.VerifyCodeRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/channels")
    public AuthChannelsDto channels() {
        return authService.loginChannels();
    }

    /** Шаг 1: зачётка → проверка в 1С. */
    @PostMapping("/identify")
    public IdentifyResponse identify(@RequestBody IdentifyRequest body, HttpSession session) {
        return authService.identify(body.studentId(), session);
    }

    /** Deep link для привязки MAX к текущей зачётке. */
    @GetMapping("/max-bind-link")
    public MaxBindLinkResponse maxBindLink(HttpSession session) {
        return authService.maxBindLink(session);
    }

    /** Обновить maxAvailable после привязки в боте. */
    @PostMapping("/refresh-identification")
    public IdentifyResponse refreshIdentification(HttpSession session) {
        return authService.refreshPendingIdentification(session);
    }

    /** Шаг 2: выбор канала → отправка кода. */
    @PostMapping("/send-code")
    public LoginChallengeResponse sendCode(@RequestBody SendCodeRequest body, HttpSession session) {
        return authService.sendCode(body.channelOrDefault(), session);
    }

    /** Шаг 3: код → сессия. */
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

    @GetMapping("/pending-identification")
    public IdentifyResponse pendingIdentification(HttpSession session) {
        return authService.pendingIdentification(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Нет незавершённой проверки зачётки"));
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
