package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.time.LocalDate;
import java.util.List;

public interface PercoClient {

    /**
     * Загрузка фото в Perco-Web после одобрения администратором.
     *
     * @param zachetka идентификатор студента в Perco (зачетная книжка / табельный)
     * @param jpeg нормализованное фото
     */
    void uploadPassPhoto(String zachetka, byte[] jpeg) throws PercoException;

    /**
     * События проходов через УРВ: {@code staff/table} → {@code /taReports/eventsTable} по дням.
     *
     * @param zachetka табельный = номер зачетной книжки
     * @param from включительно
     * @param to включительно
     */
    List<PercoAccessEvent> fetchAccessEvents(String zachetka, LocalDate from, LocalDate to)
        throws PercoException;

    /**
     * Массовые события проходов за период ({@code /api/accessReports/events}).
     * Ключ карты — табельный номер (зачетная книжка), если удалось извлечь из строки отчёта.
     * Пустая карта — endpoint недоступен / нет табельных в ответе (тогда вызывающий код
     * должен ходить поштучно через {@link #fetchAccessEvents}).
     */
    default java.util.Map<String, List<PercoAccessEvent>> fetchAccessEventsByTabel(
        LocalDate from,
        LocalDate to
    ) throws PercoException {
        return java.util.Map.of();
    }
}
