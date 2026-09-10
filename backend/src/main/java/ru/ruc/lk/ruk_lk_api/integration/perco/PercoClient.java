package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.time.LocalDate;
import java.util.List;

public interface PercoClient {

    /**
     * Загрузка фото в Perco-Web после одобрения администратором.
     *
     * @param zachetka идентификатор студента в Perco (зачётка / табельный)
     * @param jpeg нормализованное фото
     */
    void uploadPassPhoto(String zachetka, byte[] jpeg) throws PercoException;

    /**
     * События проходов: {@code staff/table} → {@code accessReports/events?userIds=…}.
     *
     * @param zachetka табельный = номер зачётки
     * @param from включительно
     * @param to включительно
     */
    List<PercoAccessEvent> fetchAccessEvents(String zachetka, LocalDate from, LocalDate to)
        throws PercoException;
}
