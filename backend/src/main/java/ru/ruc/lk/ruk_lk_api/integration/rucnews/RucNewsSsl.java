package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.security.Security;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * new.ruc.su (nginx 1.10) предлагает только {@code TLS_RSA_*} — в Java 17+ они в
 * {@code jdk.tls.disabledAlgorithms}. Без ослабления handshake падает.
 */
final class RucNewsSsl {

    private static final Logger log = LoggerFactory.getLogger(RucNewsSsl.class);
    private static final AtomicBoolean APPLIED = new AtomicBoolean(false);

    private RucNewsSsl() {}

    static void enableLegacyRsaCiphers() {
        if (!APPLIED.compareAndSet(false, true)) {
            return;
        }
        String disabled = Security.getProperty("jdk.tls.disabledAlgorithms");
        if (disabled == null || disabled.isBlank()) {
            return;
        }
        String updated = disabled
            .replace("TLS_RSA_*,", "")
            .replace("TLS_RSA_*", "")
            .replaceAll(",\\s*,", ",")
            .replaceAll("^,\\s*", "")
            .replaceAll(",\\s*$", "")
            .trim();
        if (!updated.equals(disabled)) {
            Security.setProperty("jdk.tls.disabledAlgorithms", updated);
            log.info("Ruc news: enabled legacy TLS_RSA_* ciphers for old nginx at new.ruc.su");
        }
    }
}
