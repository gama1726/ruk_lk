package ru.ruc.lk.ruk_lk_api.certificates;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class CertificateTypeTest {

    @Test
    void parsesKnownTypes() {
        assertEquals(CertificateType.SICK_LEAVE, CertificateType.fromRequest("sick_leave"));
        assertEquals(CertificateType.MILITARY_EXEMPTION, CertificateType.fromRequest("MILITARY_EXEMPTION"));
        assertEquals(CertificateType.OTHER, CertificateType.fromRequest("OTHER"));
    }

    @Test
    void rejectsUnknown() {
        assertThrows(ResponseStatusException.class, () -> CertificateType.fromRequest("foo"));
        assertThrows(ResponseStatusException.class, () -> CertificateType.fromRequest(""));
    }

    @Test
    void labelsRu() {
        assertEquals("Больничный", CertificateType.SICK_LEAVE.labelRu());
        assertEquals("Освобождение от военкомата", CertificateType.MILITARY_EXEMPTION.labelRu());
        assertEquals("Прочее", CertificateType.OTHER.labelRu());
    }
}
