package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;

public interface ZKBioClient {

    /**
     * Проходы студента за период.
     *
     * @param studentId номер зачетной книжки из 1С; сначала {@code emp_code}, иначе {@code nickname}
     */
    List<SkudAccessEvent> fetchAccessEvents(String studentId, LocalDate from, LocalDate to)
        throws ZKBioException;

    /**
     * Проходы по уже известному {@code emp_code} (без повторного поиска карточки).
     */
    List<SkudAccessEvent> fetchAccessEventsByEmpCode(String empCode, LocalDate from, LocalDate to)
        throws ZKBioException;

    /**
     * Все проходы за день (без фильтра emp_code), сгруппированные по emp_code.
     * Если API не отдаёт без emp_code — пустая карта.
     */
    Map<String, List<SkudAccessEvent>> fetchDayAccessEventsByEmpCode(LocalDate day) throws ZKBioException;

    /**
     * Полный справочник сотрудников ZKBio (с пагинацией на стороне клиента).
     */
    List<ZKBioEmployee> fetchEmployees() throws ZKBioException;

    boolean isEnabled();
}
