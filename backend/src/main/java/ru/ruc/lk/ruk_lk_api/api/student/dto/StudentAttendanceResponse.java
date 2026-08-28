package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Ответ {@code GET /api/student/attendance}. */
public record StudentAttendanceResponse(
    String source,
    List<StudentAttendanceDayResponse> days,
    StudentAttendanceSummaryResponse summary
) {
    /**
     * @param status {@code present} — был проход; {@code absent} — были занятия в вузе, прохода нет
     */
    public record StudentAttendanceDayResponse(
        String id,
        String date,
        String checkIn,
        String checkOut,
        String gate,
        String status
    ) {}

    public record StudentAttendanceSummaryResponse(
        int days,
        int absentDays,
        String earliest,
        String latest
    ) {}
}
