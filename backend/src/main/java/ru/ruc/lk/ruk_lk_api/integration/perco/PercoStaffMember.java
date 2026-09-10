package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PercoStaffMember(
    Object id,
    String fio,
    String name,
    @JsonProperty("tabel_number") String tabelNumber,
    @JsonProperty("tabelNumber") String tabelNumberAlt,
    @JsonProperty("tab_number") String tabNumber,
    /** Карта(ы): строка, массив строк или объектов с полем identifier. */
    Object identifier,
    Object division,
    @JsonProperty("division_id") Object divisionId,
    @JsonProperty("division_name") String divisionName,
    @JsonProperty("access_template") Object accessTemplate,
    @JsonProperty("template_name") String templateName
) {
    public String resolvedId() {
        if (id == null) {
            return null;
        }
        String value = String.valueOf(id).trim();
        return value.isEmpty() || "null".equals(value) ? null : value;
    }

    public String resolvedTabelNumber() {
        if (tabelNumber != null && !tabelNumber.isBlank()) {
            return tabelNumber.trim();
        }
        if (tabelNumberAlt != null && !tabelNumberAlt.isBlank()) {
            return tabelNumberAlt.trim();
        }
        if (tabNumber != null && !tabNumber.isBlank()) {
            return tabNumber.trim();
        }
        return null;
    }

    public String resolvedFio() {
        if (fio != null && !fio.isBlank()) {
            return fio.trim();
        }
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return null;
    }

    /**
     * Номера карт из staff/table или staff/{id}.
     * В accessReports фильтр {@code identifier} (contains) — единственный узкий способ
     * сузить отчёт по человеку (tabel_number / user_id в filters отчёта не поддерживаются).
     */
    public List<String> resolvedIdentifiers() {
        Set<String> cards = new LinkedHashSet<>();
        collectIdentifiers(identifier, cards);
        return List.copyOf(cards);
    }

    private static void collectIdentifiers(Object value, Set<String> out) {
        if (value == null) {
            return;
        }
        if (value instanceof String s) {
            String trimmed = s.trim();
            if (!trimmed.isEmpty() && !"null".equalsIgnoreCase(trimmed)) {
                out.add(trimmed);
            }
            return;
        }
        if (value instanceof Number n) {
            out.add(String.valueOf(n));
            return;
        }
        if (value instanceof Collection<?> c) {
            for (Object item : c) {
                collectIdentifiers(item, out);
            }
            return;
        }
        if (value instanceof Map<?, ?> m) {
            Object nested = m.get("identifier");
            if (nested == null) {
                nested = m.get("id");
            }
            if (nested == null) {
                nested = m.get("value");
            }
            if (nested != null) {
                collectIdentifiers(nested, out);
            } else {
                for (Object item : m.values()) {
                    if (item instanceof String || item instanceof Number || item instanceof Collection<?>
                        || item instanceof Map<?, ?>) {
                        collectIdentifiers(item, out);
                    }
                }
            }
            return;
        }
        if (value.getClass().isArray()) {
            int len = java.lang.reflect.Array.getLength(value);
            for (int i = 0; i < len; i++) {
                collectIdentifiers(java.lang.reflect.Array.get(value, i), out);
            }
        }
    }

    /** Отдел или шаблон доступа уже заданы в карточке Perco — не перезаписываем. */
    public boolean hasDivisionOrAccess() {
        return isPresent(division)
            || isPresent(divisionId)
            || (divisionName != null && !divisionName.isBlank())
            || isPresent(accessTemplate)
            || (templateName != null && !templateName.isBlank());
    }

    private static boolean isPresent(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof String s) {
            return !s.isBlank();
        }
        if (value instanceof Number) {
            return true;
        }
        if (value instanceof Collection<?> c) {
            return !c.isEmpty();
        }
        if (value instanceof Map<?, ?> m) {
            return !m.isEmpty();
        }
        return true;
    }
}
