package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Заглушка до подключения реального API Perco-Web.
 * Включите {@code app.perco.enabled=true} для {@link HttpPercoClient}.
 */
@Component
@ConditionalOnProperty(name = "app.perco.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingPercoClient implements PercoClient {

    @Override
    public void uploadPassPhoto(String zachetka, byte[] jpeg) {
        // Perco-Web не настроен — считаем успехом для dev; админ видит статус PERCO_SYNCED.
    }

    @Override
    public List<PercoAccessEvent> fetchAccessEvents(String zachetka, LocalDate from, LocalDate to) {
        return List.of();
    }
}
