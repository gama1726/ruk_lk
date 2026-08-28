package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.Locale;

/** Головной кампус, филиалы и посещаемость по кампусу. */
final class CampusSupport {

    private CampusSupport() {}

    static boolean isBranchCampus(String... parts) {
        for (String part : parts) {
            if (part != null && part.toLowerCase(Locale.ROOT).contains("филиал")) {
                return true;
            }
        }
        return false;
    }

    /** Казанский филиал колледжа кооперации (ККИ) — ZKBio. */
    static boolean isKazanKkiCampus(String faculty, String department) {
        if (!isBranchCampus(faculty, department)) {
            return false;
        }
        String haystack = joinLower(faculty, department);
        return haystack.contains("казан")
            && (haystack.contains("кки") || haystack.contains("kci") || haystack.contains("кооператив"));
    }

    /** Посещаемость Perco — головной вуз (не филиал). */
    static boolean isHeadCampusAttendance(String faculty, String department) {
        return !isBranchCampus(faculty, department);
    }

    private static String joinLower(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(part.trim().toLowerCase(Locale.ROOT));
            }
        }
        return sb.toString();
    }
}
