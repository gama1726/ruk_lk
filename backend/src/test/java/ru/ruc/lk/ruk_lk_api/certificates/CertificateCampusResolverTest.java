package ru.ruc.lk.ruk_lk_api.certificates;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

class CertificateCampusResolverTest {

    @Test
    void mapsKnownBranches() {
        assertEquals(LkAbsenceReportCampus.HEAD, CertificateCampusResolver.fromBranchId("main").orElseThrow());
        assertEquals(LkAbsenceReportCampus.KAZAN, CertificateCampusResolver.fromBranchId("kazan").orElseThrow());
        assertEquals(
            LkAbsenceReportCampus.KRASNODAR,
            CertificateCampusResolver.fromBranchId("krasnodar").orElseThrow()
        );
    }

    @Test
    void rejectsOtherBranches() {
        assertTrue(CertificateCampusResolver.fromBranchId("vladimir").isEmpty());
        assertTrue(CertificateCampusResolver.fromBranchId("").isEmpty());
        assertTrue(CertificateCampusResolver.fromBranchId(null).isEmpty());
    }
}
