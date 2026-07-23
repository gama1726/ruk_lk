package ru.ruc.lk.ruk_lk_api.api.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

class ScheduleMapperTest {

    @Test
    void weekAnchorsForMonth_coversFullMonth() {
        List<LocalDate> july2026 = ScheduleMapper.weekAnchorsForMonth(2026, 7);
        assertEquals(5, july2026.size());
        assertEquals(LocalDate.of(2026, 6, 29), july2026.get(0));
        assertEquals(LocalDate.of(2026, 7, 27), july2026.get(july2026.size() - 1));
        assertTrue(july2026.stream().allMatch(d -> d.getDayOfWeek().getValue() == 1));
    }

    @Test
    void weekAnchorsForMonth_february() {
        List<LocalDate> feb = ScheduleMapper.weekAnchorsForMonth(2026, 2);
        assertTrue(feb.size() >= 4 && feb.size() <= 6);
        assertTrue(feb.get(0).getDayOfWeek().getValue() == 1);
    }
}
