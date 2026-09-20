package ru.ruc.lk.ruk_lk_api.lkadmin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCFamilyResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;

class LkAbsenceReportParentContactsTest {

    @Test
    void emptyWhenNoParents() {
        assertEquals("", LkAbsenceReportService.formatParentContacts(null));
        assertEquals(
            "",
            LkAbsenceReportService.formatParentContacts(
                new OneCFamilyResponse(true, "1", "Ivan", false, false, 0, List.of())
            )
        );
    }

    @Test
    void prefersCustomerAndJoinsPhones() {
        OneCParentMember mother = new OneCParentMember(
            "Мать", "Иванова", "a@b.c", List.of("+79991112233"), false, false
        );
        OneCParentMember customer = new OneCParentMember(
            "Отец", "Иванов", "d@e.f", List.of("89992223344", "  "), true, false
        );
        String text = LkAbsenceReportService.formatParentContacts(
            new OneCFamilyResponse(true, "1", "Ivan", false, true, 2, List.of(mother, customer))
        );
        assertTrue(text.startsWith("Отец:"), text);
        assertTrue(text.contains("Мать: +79991112233"), text);
        assertTrue(text.contains("89992223344"), text);
    }
}
