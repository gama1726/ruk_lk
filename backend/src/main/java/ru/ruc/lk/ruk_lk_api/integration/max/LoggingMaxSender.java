package ru.ruc.lk.ruk_lk_api.integration.max;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.max.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingMaxSender implements VerificationMaxSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingMaxSender.class);

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public void sendLoginCode(long maxUserId, String recipientName, String code) {
        log.info("DEV: код входа в MAX для user_id={} ({}): {}", maxUserId, recipientName, code);
    }
}
