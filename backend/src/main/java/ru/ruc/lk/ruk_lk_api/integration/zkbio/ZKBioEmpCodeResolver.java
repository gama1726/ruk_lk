package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.Optional;

/**
 * Сопоставление зачетной книжки с {@code emp_code} в ZKBio:
 * точный {@code emp_code}, иначе однозначный {@code nickname}.
 */
public final class ZKBioEmpCodeResolver {

    private ZKBioEmpCodeResolver() {}

    public static Optional<String> resolveTransactionCode(String studentId, ZKBioEmployee employee) {
        if (employee == null || isBlank(employee.empCode())) {
            return Optional.empty();
        }
        if (matchesStudentId(studentId, employee.empCode())) {
            return Optional.of(employee.empCode().trim());
        }
        if (matchesStudentId(studentId, employee.nickname())) {
            return Optional.of(employee.empCode().trim());
        }
        return Optional.empty();
    }

    /**
     * Номер зачётки для 1С: {@code emp_code} длины 6, иначе {@code nickname} длины 6.
     */
    public static Optional<String> resolveGradebookId(ZKBioEmployee employee) {
        if (employee == null) {
            return Optional.empty();
        }
        String code = normalize(employee.empCode());
        if (code.length() == 6) {
            return Optional.of(code);
        }
        String nick = normalize(employee.nickname());
        if (nick.length() == 6) {
            return Optional.of(nick);
        }
        return Optional.empty();
    }

    public static boolean matchesStudentId(String studentId, String candidate) {
        if (isBlank(studentId) || isBlank(candidate)) {
            return false;
        }
        return normalize(studentId).equals(normalize(candidate));
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
