package ru.ruc.lk.ruk_lk_api.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * В prod запрещает тестовый fixed OTP-код.
 * Если MAX включён — требует webhook-secret (fail-closed).
 */
@Component
public class AuthProdSafetyRunner implements ApplicationRunner {

    private final Environment environment;
    private final String fixedCode;
    private final boolean maxEnabled;
    private final String webhookSecret;

    public AuthProdSafetyRunner(
        Environment environment,
        @Value("${app.auth.fixed-code:}") String fixedCode,
        @Value("${app.max.enabled:false}") boolean maxEnabled,
        @Value("${app.max.webhook-secret:}") String webhookSecret
    ) {
        this.environment = environment;
        this.fixedCode = fixedCode == null ? "" : fixedCode.trim();
        this.maxEnabled = maxEnabled;
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean prod = false;
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                prod = true;
                break;
            }
        }
        if (prod && !fixedCode.isEmpty()) {
            throw new IllegalStateException(
                "app.auth.fixed-code запрещён при профиле prod — уберите его из application-local.properties"
            );
        }
        if (maxEnabled && webhookSecret.isEmpty()) {
            throw new IllegalStateException(
                "app.max.enabled=true требует непустой app.max.webhook-secret"
            );
        }
    }
}
