package ru.ruc.lk.ruk_lk_api.api.features;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Зачётки, для которых во фронте открываются разделы «в разработке» (без ComingSoon).
 * Список только из properties (обычно {@code application-local.properties}):
 * {@code app.preview.student-ids=831857,123456}. Пусто — preview ни для кого.
 */
@Component
public class PreviewStudents {

    private final Set<String> studentIds;

    public PreviewStudents(@Value("${app.preview.student-ids:}") String raw) {
        Set<String> ids = new LinkedHashSet<>();
        if (raw != null) {
            for (String part : raw.split(",")) {
                if (part == null) continue;
                String id = part.trim();
                if (!id.isEmpty()) {
                    ids.add(id.toLowerCase(Locale.ROOT));
                }
            }
        }
        this.studentIds = Set.copyOf(ids);
    }

    public boolean isPreviewStudent(String studentId) {
        if (studentId == null || studentId.isBlank() || studentIds.isEmpty()) {
            return false;
        }
        return studentIds.contains(studentId.trim().toLowerCase(Locale.ROOT));
    }

    public Set<String> studentIds() {
        return studentIds;
    }
}
