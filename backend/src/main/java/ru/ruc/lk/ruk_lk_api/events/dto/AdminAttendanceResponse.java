package ru.ruc.lk.ruk_lk_api.events.dto;

import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceDayResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceSummaryResponse;

/** Посещаемость по зачётке для админки ЛК. */
public record AdminAttendanceResponse(
    String studentId,
    String fullName,
    String group,
    String faculty,
    String branch,
    boolean branchCampus,
    String source,
    List<StudentAttendanceDayResponse> days,
    StudentAttendanceSummaryResponse summary
) {
    public AdminAttendanceResponse {
        days = days == null ? List.of() : List.copyOf(days);
    }
}
