package ru.ruc.lk.ruk_lk_api.api.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.Test;

class CampusSupportTest {

    @Test
    void headCampusUsesPerco() {
        Optional<CampusSupport.AttendanceCampus> campus = CampusSupport.resolveAttendanceCampus(
            "",
            "Экономический факультет",
            "Кафедра",
            "ЭК-21"
        );
        assertEquals(CampusSupport.AttendanceCampus.HEAD, campus.orElseThrow());
    }

    @Test
    void kazanBranchUsesZkbio() {
        Optional<CampusSupport.AttendanceCampus> campus = CampusSupport.resolveAttendanceCampus(
            "Казанский кооперативный институт (филиал)",
            "",
            "",
            "КЗ21"
        );
        assertEquals(CampusSupport.AttendanceCampus.KAZAN, campus.orElseThrow());
    }

    @Test
    void otherBranchHasNoAttendance() {
        Optional<CampusSupport.AttendanceCampus> campus = CampusSupport.resolveAttendanceCampus(
            "Смоленский филиал",
            "",
            "",
            "СМ21"
        );
        assertTrue(campus.isEmpty());
    }
}
