package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

class AbsenceNoticePdfGeneratorTest {

    private final AbsenceNoticePdfGenerator generator = new AbsenceNoticePdfGenerator();

    @Test
    void generatesKazanSpoPdf() {
        byte[] pdf = generator.generate(
            AbsenceNoticeTemplate.KAZAN_SPO,
            "Иванов Иван Иванович",
            "16.09.2026",
            "неявка на все пары"
        );
        assertTrue(pdf.length > 500);
        assertTrue(pdf[0] == '%' && pdf[1] == 'P' && pdf[2] == 'D' && pdf[3] == 'F');
    }

    @Test
    void generatesKazanHePdf() {
        byte[] pdf = generator.generate(
            AbsenceNoticeTemplate.KAZAN_HE,
            "Петров Пётр Петрович",
            "01.10.2026",
            "неявка на все пары"
        );
        assertTrue(pdf.length > 500);
        assertTrue(pdf[0] == '%' && pdf[1] == 'P' && pdf[2] == 'D' && pdf[3] == 'F');
    }

    @Test
    void onlyKazanHasTemplates() {
        assertTrue(generator.hasTemplate(LkAbsenceReportCampus.KAZAN, EducationTrack.SPO));
        assertTrue(generator.hasTemplate(LkAbsenceReportCampus.KAZAN, EducationTrack.HE));
        assertFalse(generator.hasTemplate(LkAbsenceReportCampus.KRASNODAR, EducationTrack.SPO));
        assertFalse(generator.hasTemplate(LkAbsenceReportCampus.KRASNODAR, EducationTrack.HE));
        assertFalse(generator.hasTemplate(LkAbsenceReportCampus.HEAD, EducationTrack.SPO));
        assertFalse(generator.hasTemplate(LkAbsenceReportCampus.HEAD, EducationTrack.HE));
        assertEquals(Optional.empty(), generator.generate(
            LkAbsenceReportCampus.KRASNODAR,
            EducationTrack.SPO,
            "Иванов",
            "01.10.2026",
            null
        ));
    }

    @Test
    void resolveViolationsText_fullAndPartial() {
        assertEquals(
            "неявка на все пары",
            AbsenceNoticePdfGenerator.resolveViolationsText("full", "что угодно")
        );
        assertEquals(
            "1. 08:00–09:30 — Неявка\n2. 09:40–11:10 — Опоздание · 17 мин",
            AbsenceNoticePdfGenerator.resolveViolationsText(
                "partial",
                "1. 08:00–09:30 — Неявка\n2. 09:40–11:10 — Опоздание · 17 мин\n3. 12:00–13:30 — Вовремя"
            )
        );
    }
}
