package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.Test;

class ZKBioEmpCodeResolverTest {

    @Test
    void resolvesByEmpCode() {
        ZKBioEmployee employee = new ZKBioEmployee("111717", "", "");

        Optional<String> code = ZKBioEmpCodeResolver.resolveTransactionCode("111717", employee);

        assertTrue(code.isPresent());
        assertEquals("111717", code.get());
    }

    @Test
    void ignoresSsnAndNational() {
        ZKBioEmployee employee = new ZKBioEmployee("0000241", "258736", "258736");

        assertTrue(ZKBioEmpCodeResolver.resolveTransactionCode("258736", employee).isEmpty());
    }
}
