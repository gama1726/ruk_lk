package ru.ruc.lk.ruk_lk_api.integration.perco;

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
        if (value instanceof Number n) {
            return true;
        }
        if (value instanceof java.util.Collection<?> c) {
            return !c.isEmpty();
        }
        if (value instanceof java.util.Map<?, ?> m) {
            return !m.isEmpty();
        }
        return true;
    }
}
