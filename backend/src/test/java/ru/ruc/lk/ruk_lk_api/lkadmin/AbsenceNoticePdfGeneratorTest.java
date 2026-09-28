package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AbsenceNoticePdfGeneratorTest {

    @Test
    void generatesNonEmptyPdf() {
        byte[] pdf = new AbsenceNoticePdfGenerator().generate(
            "Иванов Иван Иванович",
            "16.09.2026",
            "неявка на все пары"
        );
        assertTrue(pdf.length > 500);
        assertTrue(pdf[0] == '%' && pdf[1] == 'P' && pdf[2] == 'D' && pdf[3] == 'F');
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
