package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;

@Component
@ConditionalOnProperty(name = "app.zkbio.kazan.enabled", havingValue = "false", matchIfMissing = true)
public class LoggingZKBioClient implements ZKBioClient {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public List<SkudAccessEvent> fetchAccessEvents(String studentId, LocalDate from, LocalDate to) {
        return List.of();
    }
}
