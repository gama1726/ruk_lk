package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Локальный индекс справочника ZKBio: {@code emp_code} и exact {@code nickname} → карточка.
 */
final class ZKBioEmployeesDirectory {

    private final Map<String, ZKBioEmployee> byEmpCode;
    private final Map<String, List<ZKBioEmployee>> byNickname;

    private ZKBioEmployeesDirectory(
        Map<String, ZKBioEmployee> byEmpCode,
        Map<String, List<ZKBioEmployee>> byNickname
    ) {
        this.byEmpCode = byEmpCode;
        this.byNickname = byNickname;
    }

    static ZKBioEmployeesDirectory from(List<ZKBioEmployee> employees) {
        Map<String, ZKBioEmployee> byCode = new HashMap<>();
        Map<String, List<ZKBioEmployee>> byNick = new HashMap<>();
        if (employees == null) {
            return new ZKBioEmployeesDirectory(Map.of(), Map.of());
        }
        for (ZKBioEmployee employee : employees) {
            if (employee == null) {
                continue;
            }
            String code = normalize(employee.empCode());
            if (!code.isEmpty()) {
                byCode.putIfAbsent(code, employee);
            }
            String nick = normalize(employee.nickname());
            if (!nick.isEmpty()) {
                byNick.computeIfAbsent(nick, key -> new ArrayList<>()).add(employee);
            }
        }
        return new ZKBioEmployeesDirectory(Map.copyOf(byCode), Map.copyOf(byNick));
    }

    /**
     * Зачётка → {@code emp_code} для проходов: сначала точный {@code emp_code}, иначе однозначный {@code nickname}.
     */
    Optional<String> resolveEmpCode(String zachetka) {
        String key = normalize(zachetka);
        if (key.isEmpty()) {
            return Optional.empty();
        }
        ZKBioEmployee byCode = byEmpCode.get(key);
        if (byCode != null && !isBlank(byCode.empCode())) {
            return Optional.of(byCode.empCode().trim());
        }
        List<ZKBioEmployee> byNick = byNickname.get(key);
        if (byNick == null || byNick.isEmpty()) {
            return Optional.empty();
        }
        if (byNick.size() != 1) {
            return Optional.empty();
        }
        ZKBioEmployee only = byNick.getFirst();
        if (only == null || isBlank(only.empCode())) {
            return Optional.empty();
        }
        return Optional.of(only.empCode().trim());
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replace(" ", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
