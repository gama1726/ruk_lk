package ru.ruc.lk.ruk_lk_api.integration.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

class ScheduleGroupNameNormalizerTest {

    @Test
    void stripsSlashSubgroupSuffix() {
        assertEquals(
            "ТД(ТД)2-О/Сп/КЗ25",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ТД(ТД)2-О/Сп/КЗ25-455/2")
        );
    }

    @Test
    void stripsNumericCampusTail() {
        assertEquals(
            "ТД(ТД)2-З/Сп/КЗ25",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ТД(ТД)2-З/Сп/КЗ25-8513")
        );
    }

    @Test
    void stripsSpoStyleTail() {
        assertEquals(
            "ТД3-О/СПОо/КЗ26",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ТД3-О/СПОо/КЗ26-9-363")
        );
    }

    @Test
    void stripsLetterCampusTail() {
        assertEquals(
            "ЭК(ЭО)5-О/Мп/КЗ26",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ЭК(ЭО)5-О/Мп/КЗ26-М-28")
        );
    }

    @Test
    void stripsYurTail() {
        assertEquals(
            "ЮР(ГП)1-О/Бп/КЗ25",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ЮР(ГП)1-О/Бп/КЗ25-ЮРЗ25-8")
        );
    }

    @Test
    void leavesGroupWithoutSuffixUnchanged() {
        assertEquals(
            "ЭБ(ЭПО)1-О/Сп/СР21",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ЭБ(ЭПО)1-О/Сп/СР21")
        );
        assertEquals(
            "ПД12-О/СПОо/КД23",
            ScheduleGroupNameNormalizer.stripSubgroupSuffix("ПД12-О/СПОо/КД23")
        );
    }

    @Test
    void lookupCandidatesTryOriginalThenShortened() {
        assertEquals(
            List.of("ТД(ТД)2-О/Сп/КЗ25-455/2", "ТД(ТД)2-О/Сп/КЗ25"),
            ScheduleGroupNameNormalizer.lookupCandidates("ТД(ТД)2-О/Сп/КЗ25-455/2")
        );
        assertEquals(
            List.of("БД1-О/СПОо/КЗ26-9-261", "БД1-О/СПОо/КЗ26"),
            ScheduleGroupNameNormalizer.lookupCandidates("БД1-О/СПОо/КЗ26-9-261")
        );
    }
}
