package ru.ruc.lk.ruk_lk_api.integration.schedule;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

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
    void campusCodeKeepsTrailingLetterFromTail() {
        assertEquals(
            "ПКД1-О/СПОо/КЗ26Ц",
            ScheduleGroupNameNormalizer.campusCodeWithTailLetter("ПКД1-О/СПОо/КЗ26-9-661Ц")
        );
        assertEquals(
            "ТД(ТД)4-З/Сп/КЗ25Д",
            ScheduleGroupNameNormalizer.campusCodeWithTailLetter("ТД(ТД)4-З/Сп/КЗ25-8515Д")
        );
        assertNull(ScheduleGroupNameNormalizer.campusCodeWithTailLetter("ТД3-О/СПОо/КЗ26-9-363"));
    }

    @Test
    void tdPredAliasForSpoOnly() {
        assertEquals(
            "ТД(пред)1-О/СПОо/КЗ26",
            ScheduleGroupNameNormalizer.tdPredSpoAlias("ТД1-О/СПОо/КЗ26")
        );
        assertEquals(
            "ТД(пред)1-О/СПОс/КЗ26",
            ScheduleGroupNameNormalizer.tdPredSpoAlias("ТД1-О/СПОс/КЗ26")
        );
        assertNull(ScheduleGroupNameNormalizer.tdPredSpoAlias("ТД(ТД)1-О/Сп/КЗ25"));
        assertNull(ScheduleGroupNameNormalizer.tdPredSpoAlias("ТД(пред)1-О/СПОо/КЗ26"));
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

    @Test
    void lookupCandidatesIncludeLetterAndTdPred() {
        assertEquals(
            List.of(
                "ПКД1-О/СПОо/КЗ26-9-661Ц",
                "ПКД1-О/СПОо/КЗ26",
                "ПКД1-О/СПОо/КЗ26Ц"
            ),
            ScheduleGroupNameNormalizer.lookupCandidates("ПКД1-О/СПОо/КЗ26-9-661Ц")
        );
        assertEquals(
            List.of(
                "ТД3-О/СПОо/КЗ26-9-363",
                "ТД3-О/СПОо/КЗ26",
                "ТД(пред)3-О/СПОо/КЗ26-9-363",
                "ТД(пред)3-О/СПОо/КЗ26"
            ),
            ScheduleGroupNameNormalizer.lookupCandidates("ТД3-О/СПОо/КЗ26-9-363")
        );
    }
}
