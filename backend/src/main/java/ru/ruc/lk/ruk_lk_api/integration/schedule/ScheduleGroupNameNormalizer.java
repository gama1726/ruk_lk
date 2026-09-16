package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 1С иногда отдаёт группу с хвостом после кода площадки
 * ({@code …/КЗ25-455/2}, {@code …/КЗ26-9-363}), а сервис расписания
 * знает только базовое имя ({@code …/КЗ25}, {@code …/КЗ26}).
 */
public final class ScheduleGroupNameNormalizer {

    /**
     * После {@code /} — код площадки (буквы + цифры), затем {@code -} и хвост до конца строки.
     * Примеры: {@code /КЗ25-8513}, {@code /КЗ26-М-28}, {@code /КЗ25-455/2}.
     */
    private static final Pattern CAMPUS_TAIL =
        Pattern.compile("(/[\\p{L}]+\\d+)-.+$");

    private ScheduleGroupNameNormalizer() {}

    /**
     * Варианты для {@code get_by_group_name}: сначала как в 1С, затем без хвоста после кода площадки.
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
        return CAMPUS_TAIL.matcher(groupName).replaceFirst("$1");
    }
}
