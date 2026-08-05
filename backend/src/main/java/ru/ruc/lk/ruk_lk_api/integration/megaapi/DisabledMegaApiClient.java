package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import java.util.List;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Заглушка, пока {@code app.megaapi.enabled=true} и задан токен.
 */
@Component
@ConditionalOnProperty(name = "app.megaapi.enabled", havingValue = "false", matchIfMissing = true)
public class DisabledMegaApiClient implements MegaApiClient {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public Optional<MegaReaderRecord> getReader(String rdrId) {
        return Optional.empty();
    }

    @Override
    public List<MegaBookItem> getHandBooks(String rdrId) {
        return List.of();
    }

    @Override
    public List<MegaBookItem> getDebtBooks(String rdrId) {
        return List.of();
    }

    @Override
    public List<MegaBookItem> getOrderBooks(String rdrId) {
        return List.of();
    }
}
