package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.api.student.AttendanceMapper;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceLessonResponse;

class LkAbsenceReportLessonDetailTest {

    @Test
    void formatsLessonsLikeAttendanceSection() {
        String text = LkAbsenceReportService.formatLessonAttendanceDetail(List.of(
            lesson("09:00", "10:30", AttendanceMapper.STATUS_PRESENT, "", null),
            lesson("10:40", "12:10", AttendanceMapper.STATUS_ABSENT, "", null),
            lesson("12:20", "13:50", AttendanceMapper.STATUS_UNCONFIRMED, "12:15", null),
            lesson("14:00", "15:30", AttendanceMapper.STATUS_LATE, "14:12", 12)
        ));
        assertTrue(text.contains("1. 09:00–10:30 — Вовремя"), text);
        assertTrue(text.contains("2. 10:40–12:10 — Неявка"), text);
        assertTrue(text.contains("3. 12:20–13:50 — Без выхода"), text);
        assertTrue(text.contains("4. 14:00–15:30 — Опоздание · 12 мин · вход 14:12"), text);
        assertTrue(text.contains("\n"), "пары с новой строки: " + text);
        assertFalse(text.contains("; "), text);
    }

    @Test
    void emptyList() {
        assertEquals("", LkAbsenceReportService.formatLessonAttendanceDetail(List.of()));
    }

    private static StudentAttendanceLessonResponse lesson(
        String start,
        String end,
        String status,
        String arrivedAt,
        Integer lateMinutes
    ) {
        return new StudentAttendanceLessonResponse(
            "id",
            "Subject",
            start,
            end,
            "101",
            status,
            arrivedAt,
            lateMinutes
        );
    }
}
