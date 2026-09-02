package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Индекс зачётка/SSN/national → emp_code для быстрого lookup без полного перебора на каждый запрос. */
final class ZKBioEmployeeIndex {

    private final Map<String, String> lookup;

    private ZKBioEmployeeIndex(Map<String, String> lookup) {
        this.lookup = lookup;
    }

    static ZKBioEmployeeIndex build(List<ZKBioEmployee> employees) {
        Map<String, String> map = new HashMap<>();
        if (employees != null) {
            for (ZKBioEmployee employee : employees) {
                if (employee == null || isBlank(employee.empCode())) {
                    continue;
                }
                String empCode = employee.empCode().trim();
                putKey(map, employee.empCode(), empCode);
                putKey(map, employee.ssn(), empCode);
                putKey(map, employee.national(), empCode);
            }
        }
        return new ZKBioEmployeeIndex(Map.copyOf(map));
    }

    Optional<String> findEmpCode(String studentId) {
        if (isBlank(studentId)) {
            return Optional.empty();
        }
        String code = lookup.get(normalize(studentId));
        return code == null || code.isBlank() ? Optional.empty() : Optional.of(code);
    }

    int size() {
        return lookup.size();
    }

    private static void putKey(Map<String, String> map, String rawKey, String empCode) {
        if (isBlank(rawKey)) {
            return;
        }
        map.putIfAbsent(normalize(rawKey), empCode);
    }

    private static String normalize(String value) {
        return value.trim().replace(" ", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
