package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.time.LocalDate;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;

public interface ZKBioClient {

    /**
     * Проходы студента за период.
     *
     * @param studentId номер зачётки из 1С; ищем только по {@code emp_code}
     */
    List<SkudAccessEvent> fetchAccessEvents(String studentId, LocalDate from, LocalDate to)
        throws ZKBioException;

    boolean isEnabled();
}
