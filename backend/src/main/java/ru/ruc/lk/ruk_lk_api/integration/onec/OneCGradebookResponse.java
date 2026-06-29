package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

/**
 * Ответ {@code GET /hs/student/gradebook?studentId=...}.
 */
public record OneCGradebookResponse(
    boolean found,
    String studentId,
    String studentFullName,
    List<String> semesters,
    List<OneCGradebookItem> items
) {}
