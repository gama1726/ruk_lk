package ru.ruc.lk.ruk_lk_api.integration.max;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MaxBindingService {

    private static final Logger log = LoggerFactory.getLogger(MaxBindingService.class);
    private static final String TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    private static final int TOKEN_LENGTH = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudentMaxBindingRepository bindingRepository;
    private final MaxBindTokenRepository tokenRepository;
    private final VerificationMaxSender maxSender;
    private final MaxProperties properties;
    private final ObjectProvider<MaxBotIdentity> botIdentity;

    public MaxBindingService(
        StudentMaxBindingRepository bindingRepository,
        MaxBindTokenRepository tokenRepository,
        VerificationMaxSender maxSender,
        MaxProperties properties,
        ObjectProvider<MaxBotIdentity> botIdentity
    ) {
        this.bindingRepository = bindingRepository;
        this.tokenRepository = tokenRepository;
        this.maxSender = maxSender;
        this.properties = properties;
        this.botIdentity = botIdentity;
    }

    public boolean isLoginChannelEnabled() {
        return properties.isLoginOption() && maxSender.isConfigured();
    }

    public Optional<Long> findMaxUserId(String studentId) {
        if (studentId == null || studentId.isBlank()) {
            return Optional.empty();
        }
        return bindingRepository.findById(studentId.trim()).map(StudentMaxBinding::getMaxUserId);
    }

    public boolean isBound(String studentId) {
        return findMaxUserId(studentId).isPresent();
    }

    @Transactional
    public MaxBindLink createBindLink(String studentId) {
        if (!isLoginChannelEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Вход через MAX недоступен");
        }
        String botUsername = resolveBotUsername();
        if (botUsername.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "MAX не настроен: укажите app.max.bot-username или дождитесь ответа /me"
            );
        }
        if (studentId == null || studentId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала укажите номер зачётки");
        }

        String normalizedStudentId = studentId.trim();
        tokenRepository.deleteByStudentId(normalizedStudentId);

        String token = randomToken();
        Instant expiresAt = Instant.now().plus(properties.getBindTokenTtlMinutes(), ChronoUnit.MINUTES);
        tokenRepository.save(new MaxBindToken(token, normalizedStudentId, expiresAt));

        String url = "https://max.ru/" + botUsername + "?start=" + token;
        long expiresIn = ChronoUnit.SECONDS.between(Instant.now(), expiresAt);
        return new MaxBindLink(url, Math.max(expiresIn, 1));
    }

    @Transactional
    public boolean completeBind(String payload, Long maxUserId) {
        if (payload == null || payload.isBlank() || maxUserId == null) {
            return false;
        }

        String token = payload.trim();
        Optional<MaxBindToken> bindToken = tokenRepository.findById(token);
        if (bindToken.isEmpty()) {
            log.info("MAX bind: неизвестный токен");
            return false;
        }

        MaxBindToken challenge = bindToken.get();
        if (challenge.isExpired(Instant.now())) {
            tokenRepository.delete(challenge);
            log.info("MAX bind: токен истёк для student_id={}", challenge.getStudentId());
            return false;
        }

        String studentId = challenge.getStudentId();
        Instant now = Instant.now();

        bindingRepository.findByMaxUserId(maxUserId).ifPresent(existing -> {
            if (!existing.getStudentId().equals(studentId)) {
                log.info(
                    "MAX bind: user_id={} перенесён с {} на {}",
                    maxUserId,
                    existing.getStudentId(),
                    studentId
                );
                bindingRepository.delete(existing);
            }
        });

        bindingRepository.findById(studentId).ifPresentOrElse(
            existing -> {
                existing.rebind(maxUserId, now);
                bindingRepository.save(existing);
            },
            () -> bindingRepository.save(new StudentMaxBinding(studentId, maxUserId, now))
        );

        tokenRepository.delete(challenge);
        tokenRepository.deleteByStudentId(studentId);

        try {
            maxSender.sendMessage(
                maxUserId,
                "Готово! MAX привязан к личному кабинету РУК.\n\n"
                    + "Теперь коды входа будут приходить в этот чат."
            );
        } catch (MaxSendException e) {
            log.warn("MAX bind: не удалось отправить подтверждение user_id={}", maxUserId, e);
        }

        log.info("MAX bind: student_id={} → user_id={}", studentId, maxUserId);
        return true;
    }

    public record MaxBindLink(String url, long expiresInSeconds) {}

    private String resolveBotUsername() {
        MaxBotIdentity identity = botIdentity.getIfAvailable();
        if (identity != null) {
            return identity.botUsername();
        }
        return properties.getBotUsername() == null ? "" : properties.getBotUsername().trim();
    }

    private static String randomToken() {
        StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            sb.append(TOKEN_ALPHABET.charAt(RANDOM.nextInt(TOKEN_ALPHABET.length())));
        }
        return sb.toString();
    }
}
