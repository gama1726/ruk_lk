package ru.ruc.lk.ruk_lk_api.integration.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

class ScheduleGroupNameNormalizerTest {

    @Test
    void stripsSubgroupSuffixForScheduleLookup() {
        assertEquals(
            "ТД(ТД)2-О/Сп/КЗ25",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ТД(ТД)2-О/Сп/КЗ25-455/2")
        );
    }

    @Test
    void leavesGroupWithoutSuffixUnchanged() {
        assertEquals(
            "ЭБ(ЭПО)1-О/Сп/СР21",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ЭБ(ЭПО)1-О/Сп/СР21")
        );
    }

    @Test
    void lookupCandidatesTryOriginalThenShortened() {
        assertEquals(
            List.of("ТД(ТД)2-О/Сп/КЗ25-455/2", "ТД(ТД)2-О/Сп/КЗ25"),
            ScheduleGroupNameNormalizer.lookupCandidates("ТД(ТД)2-О/Сп/КЗ25-455/2")
        );
    }
}
