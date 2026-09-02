package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 1С иногда отдаёт группу с подгрупповым хвостом ({@code -455/2}),
 * а сервис расписания знает только базовое имя ({@code КЗ25}).
 */
public final class ScheduleGroupNameNormalizer {

    /** Хвост вида {@code -455/2} в конце названия группы. */
    private static final Pattern SUBGROUP_SUFFIX = Pattern.compile("-\\d+/\\d+$");

    private ScheduleGroupNameNormalizer() {}

    /**
     * Варианты для {@code get_by_group_name}: сначала как в 1С, затем без подгруппового хвоста.
     */
    public static List<String> lookupCandidates(String groupName) {
        if (groupName == null || groupName.isBlank()) {
            return List.of();
        }
        String trimmed = groupName.trim();
        List<String> candidates = new ArrayList<>(2);
        candidates.add(trimmed);
        String shortened = stripSubgroupSuffix(trimmed);
        if (!shortened.equals(trimmed)) {
            candidates.add(shortened);
        }
        return candidates;
    }

    static String stripSubgroupSuffix(String groupName) {
        return SUBGROUP_SUFFIX.matcher(groupName).replaceFirst("");
    }
}
