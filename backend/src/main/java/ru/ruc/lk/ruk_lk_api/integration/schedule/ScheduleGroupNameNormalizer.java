package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 1С иногда отдаёт группу с хвостом после кода площадки
 * ({@code …/КЗ25-455/2}, {@code …/КЗ26-9-363}), а сервис расписания
 * знает только базовое имя ({@code …/КЗ25}, {@code …/КЗ26}).
 * <p>
 * Дополнительно: буква в конце хвоста ({@code …-661Ц}) → кандидат {@code …/КЗ26Ц};
 * для СПО {@code ТД1…/СПОо|СПОс/…} = {@code ТД(пред)1…} в расписании.
 */
public final class ScheduleGroupNameNormalizer {

    /**
     * После {@code /} — код площадки (буквы + цифры), затем {@code -} и хвост до конца строки.
     * Примеры: {@code /КЗ25-8513}, {@code /КЗ26-М-28}, {@code /КЗ25-455/2}.
     */
    private static final Pattern CAMPUS_TAIL =
        Pattern.compile("(/[\\p{L}]+\\d+)-.+$");

    /** Хвост после кода площадки заканчивается буквами: {@code /КЗ26-9-661Ц} → {@code /КЗ26Ц}. */
    private static final Pattern CAMPUS_TAIL_LETTER =
        Pattern.compile("(/[\\p{L}]+\\d+)-.+([\\p{L}]+)$");

    /** СПО без скобок: {@code ТД1-О/СПОо/…} ↔ {@code ТД(пред)1-О/СПОо/…}. */
    private static final Pattern TD_SPO_PLAIN =
        Pattern.compile("^ТД(\\d.*)$");

    private ScheduleGroupNameNormalizer() {}

    /**
     * Варианты для {@code get_by_group_name}: оригинал, без хвоста, с буквой на коде, алиас ТД(пред).
     */
    public static List<String> lookupCandidates(String groupName) {
        if (groupName == null || groupName.isBlank()) {
            return List.of();
        }
        String trimmed = groupName.trim();
        Set<String> candidates = new LinkedHashSet<>();
        candidates.add(trimmed);

        String shortened = stripSubgroupSuffix(trimmed);
        if (!shortened.equals(trimmed)) {
            candidates.add(shortened);
        }
        String withLetter = campusCodeWithTailLetter(trimmed);
        if (withLetter != null) {
            candidates.add(withLetter);
        }

        for (String name : List.copyOf(candidates)) {
            String tdPred = tdPredSpoAlias(name);
            if (tdPred != null) {
                candidates.add(tdPred);
            }
        }
        return new ArrayList<>(candidates);
    }

    static String stripSubgroupSuffix(String groupName) {
        return CAMPUS_TAIL.matcher(groupName).replaceFirst("$1");
    }

    /** {@code …/КЗ26-9-661Ц} → {@code …/КЗ26Ц}; без хвостовых букв — {@code null}. */
    static String campusCodeWithTailLetter(String groupName) {
        Matcher matcher = CAMPUS_TAIL_LETTER.matcher(groupName);
        if (!matcher.find()) {
            return null;
        }
        return matcher.replaceFirst("$1$2");
    }

    /** Для {@code /СПОо/} и {@code /СПОс/}: {@code ТД1…} → {@code ТД(пред)1…}. */
    static String tdPredSpoAlias(String groupName) {
        if (groupName == null
            || (!groupName.contains("/СПОо/") && !groupName.contains("/СПОс/"))) {
            return null;
        }
        Matcher matcher = TD_SPO_PLAIN.matcher(groupName);
        if (!matcher.matches()) {
            return null;
        }
        return "ТД(пред)" + matcher.group(1);
    }
}
