package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Ответ {@code GET /api/student/library}. */
public record StudentLibraryResponse(
    String studentId,
    /** active | missing | unavailable */
    String status,
    String holderName,
    List<LibraryBookDto> onHand,
    List<LibraryBookDto> debts,
    List<LibraryBookDto> orders
) {
    public record LibraryBookDto(
        String id,
        String title,
        String author,
        String biblio,
        String takenAt,
        String dueDate,
        String displayTakenAt,
        String displayDueDate,
        String bookPoint,
        /** on-hand | overdue | ordered */
        String status
    ) {}
}
