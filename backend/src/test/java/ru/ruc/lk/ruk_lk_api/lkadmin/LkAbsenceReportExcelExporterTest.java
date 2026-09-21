package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;

class LkAbsenceReportExcelExporterTest {

    @Test
    void buildsNonEmptyXlsx() {
        byte[] bytes = LkAbsenceReportExcelExporter.build(
            "2026-09-21",
            "Казань",
            10,
            1,
            List.of(new AbsenceReportRowDto(
                "21.09.2026",
                "КК-101",
                "123456",
                "Иванов Иван",
                "+79001234567",
                "09:00–10:30",
                "09:00–10:30 · неявка",
                false,
                "full"
            ))
        );
        // ZIP/OOXML signature
        assertTrue(bytes.length > 100);
        assertTrue(bytes[0] == 'P' && bytes[1] == 'K');
    }
}
