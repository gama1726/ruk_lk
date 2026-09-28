package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AbsenceNoticePdfGeneratorTest {

    @Test
    void generatesNonEmptyPdf() {
        byte[] pdf = new AbsenceNoticePdfGenerator().generate("Иванов Иван Иванович", "16.09.2026");
        assertTrue(pdf.length > 500);
        assertTrue(pdf[0] == '%' && pdf[1] == 'P' && pdf[2] == 'D' && pdf[3] == 'F');
    }
}
