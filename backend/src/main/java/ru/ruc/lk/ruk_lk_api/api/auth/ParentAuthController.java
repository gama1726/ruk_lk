package ru.ruc.lk.ruk_lk_api.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MaxBindLinkResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentDeliveryOptionsDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentFamilyResponseDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentIdentifyRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentLoginChallengeDto;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentMeResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentSelectMemberRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentSendCodeRequest;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.ParentVerifyCodeRequest;

@RestController
@RequestMapping("/api/auth/parent")
public class ParentAuthController {

    private final ParentAuthService parentAuthService;
    private final AuthIpRateLimiter authIpRateLimiter;

    public ParentAuthController(ParentAuthService parentAuthService, AuthIpRateLimiter authIpRateLimiter) {
        this.parentAuthService = parentAuthService;
        this.authIpRateLimiter = authIpRateLimiter;
    }

    @PostMapping("/identify")
    public ParentFamilyResponseDto identify(
        @RequestBody ParentIdentifyRequest body,
        HttpServletRequest request,
        HttpSession session
    ) {
        authIpRateLimiter.checkIdentifyAllowed(request);
        return parentAuthService.identify(body.studentId(), session);
    }

    @GetMapping("/pending-family")
    public ParentFamilyResponseDto pendingFamily(HttpSession session) {
        return parentAuthService.pendingFamily(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Нет незавершённого входа"
            ));
    }

    @PostMapping("/select-member")
    public ParentDeliveryOptionsDto selectMember(
        @RequestBody ParentSelectMemberRequest body,
        HttpSession session
    ) {
        return parentAuthService.selectMember(body.memberIndex(), session);
    }

    @GetMapping("/pending-delivery")
    public ParentDeliveryOptionsDto pendingDelivery(HttpSession session) {
        return parentAuthService.pendingDelivery(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Сначала выберите родителя"
            ));
    }

    @GetMapping("/max-bind-link")
    public MaxBindLinkResponse maxBindLink(HttpSession session) {
        return parentAuthService.maxBindLink(session);
    }

    @PostMapping("/refresh-delivery")
    public ParentDeliveryOptionsDto refreshDelivery(HttpSession session) {
        return parentAuthService.refreshDelivery(session);
    }

    @PostMapping("/send-code")
    public ParentLoginChallengeDto sendCode(
        @RequestBody(required = false) ParentSendCodeRequest body,
        HttpSession session
    ) {
        LoginCodeChannel channel = body == null ? LoginCodeChannel.EMAIL : body.channelOrDefault();
        return parentAuthService.sendCode(channel, session);
    }

    @PostMapping("/verify-code")
    public ParentMeResponse verifyCode(
        @RequestBody ParentVerifyCodeRequest body,
        HttpServletRequest request
    ) {
        return parentAuthService.verifyCode(body.code(), request);
    }

    @GetMapping("/me")
    public ParentMeResponse me(HttpSession session) {
        return parentAuthService.currentUser(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Необходимо войти в систему"
            ));
    }

    @GetMapping("/pending-challenge")
    public ParentLoginChallengeDto pendingChallenge(HttpSession session) {
        return parentAuthService.pendingChallenge(session)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Нет незавершённого входа"
            ));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpSession session) {
        parentAuthService.logout(session);
    }
}
