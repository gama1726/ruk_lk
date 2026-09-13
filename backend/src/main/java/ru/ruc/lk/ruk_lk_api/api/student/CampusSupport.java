package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

/** Головной кампус, Казань, прочие филиалы. */
public final class CampusSupport {

    private static final Pattern KAZAN_GROUP_CODE = Pattern.compile("кз\\d{2}", Pattern.CASE_INSENSITIVE);

    public enum AttendanceCampus {
        HEAD,
        KAZAN
    }

    private CampusSupport() {}

    public static boolean isBranchCampus(String... parts) {
        for (String part : parts) {
            if (part != null && part.toLowerCase(Locale.ROOT).contains("филиал")) {
                return true;
            }
        }
        return false;
    }

    /**
     * СКУД есть только у головы (Perco) и Казани (ZKBio).
     * Совпадает с правилом кампуса мероприятий.
     */
    public static Optional<AttendanceCampus> resolveAttendanceCampus(OneCProfileResponse profile) {
        if (profile == null) {
            return Optional.of(AttendanceCampus.HEAD);
        }
        return resolveAttendanceCampus(
            profile.branch(),
            profile.faculty(),
            profile.department(),
            profile.group()
        );
    }

    static Optional<AttendanceCampus> resolveAttendanceCampus(String... parts) {
        String haystack = joinLower(parts);
        if (haystack.contains("казан")
            || haystack.contains("/кз")
            || KAZAN_GROUP_CODE.matcher(haystack).find()) {
            return Optional.of(AttendanceCampus.KAZAN);
        }
        if (haystack.contains("филиал")) {
            return Optional.empty();
        }
        return Optional.of(AttendanceCampus.HEAD);
    }

    private static String joinLower(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(part.trim().toLowerCase(Locale.ROOT));
        }
        return sb.toString();
    }
}
