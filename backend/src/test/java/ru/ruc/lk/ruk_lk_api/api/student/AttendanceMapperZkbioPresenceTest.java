package ru.ruc.lk.ruk_lk_api.api.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse.StudentAttendanceDayResponse;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent;
import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction;

class AttendanceMapperZkbioPresenceTest {

    @Test
    void onlyExitIsNotAbsent() {
        LocalDate day = LocalDate.of(2026, 9, 8);
        var events = List.of(
            new SkudAccessEvent("2026-09-08 14:53:28", "Ершова выход", Direction.OUT)
        );
        var lessons = List.of(
            new CampusLesson(day, LocalTime.of(9, 0), LocalTime.of(10, 30), "Пара", "101")
        );

        StudentAttendanceResponse response = AttendanceMapper.toResponse("zkbio", events, lessons);
        StudentAttendanceDayResponse row = response.days().get(0);

        assertEquals("present", row.status());
        assertEquals("", row.checkIn());
        assertEquals("14:53", row.checkOut());
        assertTrue(row.gate().startsWith("Был только выход"));
        assertEquals(0, response.summary().absentDays());
    }

    @Test
    void checkInAndOutFollowTurnstiles() {
        var events = List.of(
            new SkudAccessEvent("2026-09-10 11:08:12", "Ершова выход", Direction.OUT),
            new SkudAccessEvent("2026-09-10 11:19:41", "Ершова вход", Direction.IN),
            new SkudAccessEvent("2026-09-10 15:56:06", "Ершова выход", Direction.OUT)
        );

        StudentAttendanceResponse response = AttendanceMapper.toResponse("zkbio", events, List.of());
        StudentAttendanceDayResponse row = response.days().get(0);

        assertEquals("11:19", row.checkIn());
        assertEquals("15:56", row.checkOut());
        assertEquals("Ершова вход", row.gate());
    }

    @Test
    void onlyEntryHasNoCheckout() {
        var events = List.of(
            new SkudAccessEvent("2026-09-09 14:52:50", "Ершова вход", Direction.IN)
        );

        StudentAttendanceResponse response = AttendanceMapper.toResponse("zkbio", events, List.of());
        StudentAttendanceDayResponse row = response.days().get(0);

        assertEquals("14:52", row.checkIn());
        assertEquals("", row.checkOut());
        assertTrue(row.gate().contains("выход не зафиксирован"));
    }
}
