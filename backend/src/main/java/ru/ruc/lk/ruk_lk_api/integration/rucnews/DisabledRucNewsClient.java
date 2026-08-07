package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.ruc-news.enabled", havingValue = "false", matchIfMissing = true)
public class DisabledRucNewsClient implements RucNewsClient {

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public List<RucNewsItem> fetchLatest() {
        return List.of();
    }
}
