package ru.ruc.lk.ruk_lk_api.lkadmin;

/** Кампус отчёта отсутствующих. */
public enum LkAbsenceReportCampus {
    /** Казань — ZKBio. */
    KAZAN,
    /** Краснодар — общий Perco, зоны {@code Краснодар-*}. */
    KRASNODAR;

    public String sourceCode() {
        return this == KRASNODAR ? "perco" : "zkbio";
    }

    public String campusLabel() {
        return this == KRASNODAR ? "Краснодар (Perco)" : "Казань (ZKBio)";
    }

    public static LkAbsenceReportCampus fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            return KRASNODAR;
        }
        String value = raw.trim().toUpperCase(java.util.Locale.ROOT);
        if ("KAZAN".equals(value) || "ZKBIO".equals(value)) {
            return KAZAN;
        }
        if ("KRASNODAR".equals(value) || "PERCO".equals(value)) {
            return KRASNODAR;
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST,
            "Кампус: KRASNODAR или KAZAN"
        );
    }

    public static LkAbsenceReportCampus fromSource(String source) {
        if (source != null && "perco".equalsIgnoreCase(source.trim())) {
            return KRASNODAR;
        }
        return KAZAN;
    }
}
