package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.util.List;

public interface RucNewsClient {

    boolean isEnabled();

    /**
     * @return лента; пустой список если недоступно или на сайте ничего нет
     */
    List<RucNewsItem> fetchLatest();

    /** Последняя загрузка прошла успешно (даже если элементов 0). */
    boolean lastFetchOk();
}
