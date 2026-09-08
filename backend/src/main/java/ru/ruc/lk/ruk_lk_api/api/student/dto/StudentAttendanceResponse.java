package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Ответ {@code GET /api/student/attendance}. */
public record StudentAttendanceResponse(
    String source,
    List<StudentAttendanceDayResponse> days,
    StudentAttendanceSummaryResponse summary
) {
    /**
     * @param status {@code present} — был на территории; {@code absent} — очные пары без присутствия
     * @param lessons очные пары дня со статусом вовремя / опоздание / отсутствие
     */
    public record StudentAttendanceDayResponse(
        String id,
        String date,
        String checkIn,
        String checkOut,
        String gate,
        String status,
        List<StudentAttendanceLessonResponse> lessons
    ) {}

    /**
     * @param status {@code present} | {@code late} | {@code absent} | {@code unconfirmed}
     *               ({@code unconfirmed} — вход был, выход не зафиксирован)
     * @param arrivedAt время появления на территории относительно пары (пусто при отсутствии)
     * @param lateMinutes минуты опоздания; 0 если вовремя; null при отсутствии / не подтверждено
     */
    public record StudentAttendanceLessonResponse(
        String id,
        String subject,
        String startTime,
        String endTime,
        String classroom,
        String status,
        String arrivedAt,
        Integer lateMinutes
    ) {}

    public record StudentAttendanceSummaryResponse(
        int days,
        int absentDays,
        int lateLessons,
        int unconfirmedLessons,
        String earliest,
        String latest
    ) {}
}
