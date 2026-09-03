package ru.ruc.lk.ruk_lk_api.events;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

/** Определяет кампус календаря по профилю 1С. */
final class EventCampusResolver {

    private static final Pattern KAZAN_GROUP_CODE = Pattern.compile("кз\\d{2}", Pattern.CASE_INSENSITIVE);

    private EventCampusResolver() {}

    static Optional<EventCampus> resolve(OneCProfileResponse profile) {
        if (profile == null) {
            return Optional.of(EventCampus.HEAD);
        }
        String haystack = joinLower(
            profile.branch(),
            profile.faculty(),
            profile.department(),
            profile.group()
        );
        if (haystack.contains("казан")
            || haystack.contains("/кз")
            || KAZAN_GROUP_CODE.matcher(haystack).find()) {
            return Optional.of(EventCampus.KAZAN);
        }
        if (haystack.contains("филиал")) {
            return Optional.empty();
        }
        return Optional.of(EventCampus.HEAD);
    }

    static EventCampus requireAdminCampus(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите кампус: HEAD или KAZAN");
        }
        try {
            return EventCampus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Кампус должен быть HEAD или KAZAN");
        }
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
