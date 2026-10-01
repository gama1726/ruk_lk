package ru.ruc.lk.ruk_lk_api.api.student;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class UniversityBranchCatalogTest {

    @Test
    void resolvesKnownBranches() {
        assertEquals("kazan", UniversityBranchCatalog.resolveFromBranchLabel(
            "Казанский кооперативный институт (филиал)"
        ).id());
        assertEquals("krasnodar", UniversityBranchCatalog.resolveFromBranchLabel(
            "Краснодарский кооперативный институт (филиал)"
        ).id());
        assertEquals("cheb", UniversityBranchCatalog.resolveFromBranchLabel(
            "Чебоксарский кооперативный институт (филиал)"
        ).id());
        assertEquals("main", UniversityBranchCatalog.resolveFromBranchLabel(
            "Российский университет кооперации"
        ).id());
        assertEquals("main", UniversityBranchCatalog.resolveFromBranchLabel(null).id());
    }

    @Test
    void migratesLegacyAnalyticsCodes() {
        assertEquals("kazan", UniversityBranchCatalog.migrateLegacyCampusId("KAZAN"));
        assertEquals("krasnodar", UniversityBranchCatalog.migrateLegacyCampusId("KRASNODAR"));
        assertEquals("main", UniversityBranchCatalog.migrateLegacyCampusId("HEAD"));
        assertEquals(null, UniversityBranchCatalog.migrateLegacyCampusId("OTHER"));
        assertEquals("vladimir", UniversityBranchCatalog.migrateLegacyCampusId("vladimir"));
    }
}
