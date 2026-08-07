package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.util.List;

public interface RucNewsClient {

    boolean isEnabled();

    List<RucNewsItem> fetchLatest();
}
