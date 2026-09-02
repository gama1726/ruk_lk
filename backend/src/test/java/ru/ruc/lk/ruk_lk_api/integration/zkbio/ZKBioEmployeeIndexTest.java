package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class ZKBioEmployeeIndexTest {

    @Test
    void findsByNationalInIndex() {
        ZKBioEmployeeIndex index = ZKBioEmployeeIndex.build(List.of(
            new ZKBioEmployee("0000241", "", "258736")
        ));

        Optional<String> code = index.findEmpCode("258736");

        assertTrue(code.isPresent());
        assertEquals("0000241", code.get());
    }
}
