package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.Test;

class ZKBioEmpCodeResolverTest {

    @Test
    void resolvesByNationalField() {
        ZKBioEmployee employee = new ZKBioEmployee("0000241", "", "258736");

        Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode("258736", employee);

        assertTrue(code.isPresent());
        assertEquals("0000241", code.get());
    }

    @Test
    void resolvesBySsnField() {
        ZKBioEmployee employee = new ZKBioEmployee("965572", "965572", "");

        Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode("965572", employee);

        assertTrue(code.isPresent());
        assertEquals("965572", code.get());
    }

    @Test
    void ignoresWhenNoIdMatch() {
        ZKBioEmployee employee = new ZKBioEmployee("0000241", "", "999999");

        assertTrue(ZKBioEmpCodeResolver.resolveTransactionCode("258736", employee).isEmpty());
    }
}
