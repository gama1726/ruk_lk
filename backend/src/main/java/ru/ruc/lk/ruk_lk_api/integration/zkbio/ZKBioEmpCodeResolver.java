package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.Optional;

/** Сопоставление номера зачётки с {@code emp_code} в ZKBio (SSN / national / emp_code). */
final class ZKBioEmpCodeResolver {

    private ZKBioEmpCodeResolver() {}

    static Optional<String> resolveTransactionCode(String studentId, ZKBioEmployee employee) {
        if (employee == null || isBlank(employee.empCode())) {
            return Optional.empty();
        }
        if (matchesStudentId(studentId, employee.ssn())
            || matchesStudentId(studentId, employee.national())
            || matchesStudentId(studentId, employee.empCode())) {
            return Optional.of(employee.empCode().trim());
        }
        return Optional.empty();
    }

    static boolean matchesStudentId(String studentId, String candidate) {
        if (isBlank(studentId) || isBlank(candidate)) {
            return false;
        }
        return normalizeId(studentId).equals(normalizeId(candidate));
    }

    private static String normalizeId(String value) {
        return value.trim().replace(" ", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
