package ru.ruc.lk.ruk_lk_api.certificates;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

/**
 * Правило exclusion в отчёте: день D входит в [approvedFrom, approvedTo].
 */
class CertificatePeriodCoverageTest {

    @Test
    void inclusiveRange() {
        LocalDate from = LocalDate.of(2026, 3, 10);
        LocalDate to = LocalDate.of(2026, 3, 12);
        assertTrue(covers(from, to, LocalDate.of(2026, 3, 10)));
        assertTrue(covers(from, to, LocalDate.of(2026, 3, 11)));
        assertTrue(covers(from, to, LocalDate.of(2026, 3, 12)));
        assertFalse(covers(from, to, LocalDate.of(2026, 3, 9)));
        assertFalse(covers(from, to, LocalDate.of(2026, 3, 13)));
    }

    @Test
    void singleDay() {
        LocalDate day = LocalDate.of(2026, 3, 26);
        assertTrue(covers(day, day, day));
        assertFalse(covers(day, day, day.plusDays(1)));
    }

    static boolean covers(LocalDate approvedFrom, LocalDate approvedTo, LocalDate day) {
        return approvedFrom != null
            && approvedTo != null
            && !day.isBefore(approvedFrom)
            && !day.isAfter(approvedTo);
    }
}
