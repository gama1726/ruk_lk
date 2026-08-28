package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.time.LocalDate;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;

public interface ZKBioClient {

    /**
     * Проходы студента за период.
     *
     * @param empCode код в ZKBio (для ККИ — номер зачётки)
     */
    List<SkudAccessEvent> fetchAccessEvents(String empCode, LocalDate from, LocalDate to)
        throws ZKBioException;

    boolean isEnabled();
}
