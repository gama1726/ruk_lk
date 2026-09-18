package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class ZKBioEmpCodeResolverTest {

    @Test
    void resolvesByEmpCode() {
        ZKBioEmployee employee = new ZKBioEmployee("111717", "", "", null, null, null);

        Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode("111717", employee);

        assertTrue(code.isPresent());
        assertEquals("111717", code.get());
    }

    @Test
    void resolvesByNicknameToEmpCode() {
        ZKBioEmployee employee = new ZKBioEmployee("0000005", "286749", null, "286749", "Махяддин", "Рзаев");

        Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode("286749", employee);

        assertTrue(code.isPresent());
        assertEquals("0000005", code.get());
    }

    @Test
    void ignoresSsnAndNationalWithoutNickname() {
        ZKBioEmployee employee = new ZKBioEmployee("0000241", "258736", "258736", null, null, null);

        assertTrue(ZKBioEmpCodeResolver.resolveTransactionCode("258736", employee).isEmpty());
    }

    @Test
    void gradebookPrefersEmpCodeLength6() {
        ZKBioEmployee employee = new ZKBioEmployee("324288", null, null, "999999", null, null);
        assertEquals(Optional.of("324288"), ZKBioEmpCodeResolver.resolveGradebookId(employee));
    }

    @Test
    void gradebookFallsBackToNicknameLength6() {
        ZKBioEmployee employee = new ZKBioEmployee("0000005", null, null, "286749", null, null);
        assertEquals(Optional.of("286749"), ZKBioEmpCodeResolver.resolveGradebookId(employee));
    }

    @Test
    void directoryResolvesNicknameUniquely() {
        ZKBioEmployeesDirectory directory = ZKBioEmployeesDirectory.from(List.of(
            new ZKBioEmployee("0000005", null, null, "286749", null, null),
            new ZKBioEmployee("111717", null, null, null, null, null)
        ));

        assertEquals(Optional.of("0000005"), directory.resolveEmpCode("286749"));
        assertEquals(Optional.of("111717"), directory.resolveEmpCode("111717"));
        assertTrue(directory.resolveEmpCode("unknown").isEmpty());
    }

    @Test
    void directoryRejectsAmbiguousNickname() {
        ZKBioEmployeesDirectory directory = ZKBioEmployeesDirectory.from(List.of(
            new ZKBioEmployee("0000005", null, null, "286749", null, null),
            new ZKBioEmployee("0000006", null, null, "286749", null, null)
        ));

        assertTrue(directory.resolveEmpCode("286749").isEmpty());
    }
}
