package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Ответ {@code GET /api/student/attendance}. */
public record StudentAttendanceResponse(
    String source,
    List<StudentAttendanceDayResponse> days,
    StudentAttendanceSummaryResponse summary
) {
    public record StudentAttendanceDayResponse(
        String id,
        String date,
        String checkIn,
        String checkOut,
        String gate
    ) {}

    public record StudentAttendanceSummaryResponse(
        int days,
        String earliest,
        String latest
    ) {}
}
