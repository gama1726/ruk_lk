package ru.ruc.lk.ruk_lk_api.certificates;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminSection;

class CertificateAdminSectionTest {

    @Test
    void mapsCampusToSection() {
        assertEquals(
            LkAdminSection.CERTIFICATE_REVIEW_KAZAN,
            LkAdminSection.forCertificateCampus(LkAbsenceReportCampus.KAZAN)
        );
        assertEquals(
            LkAdminSection.CERTIFICATE_REVIEW_KRASNODAR,
            LkAdminSection.forCertificateCampus(LkAbsenceReportCampus.KRASNODAR)
        );
        assertEquals(
            LkAdminSection.CERTIFICATE_REVIEW_HEAD,
            LkAdminSection.forCertificateCampus(LkAbsenceReportCampus.HEAD)
        );
    }

    @Test
    void absenceSectionDoesNotImplyCertificate() {
        assertFalse(LkAdminSection.isCertificateReviewSection(LkAdminSection.ABSENCE_REPORT_KAZAN));
        assertTrue(LkAdminSection.isCertificateReviewSection(LkAdminSection.CERTIFICATE_REVIEW_KAZAN));
    }
}
