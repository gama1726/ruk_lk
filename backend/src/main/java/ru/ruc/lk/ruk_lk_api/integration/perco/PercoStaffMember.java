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
    @JsonProperty("tab_number") String tabNumber
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
}
