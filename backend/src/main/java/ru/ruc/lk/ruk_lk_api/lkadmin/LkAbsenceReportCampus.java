package ru.ruc.lk.ruk_lk_api.lkadmin;

/** Кампус отчёта отсутствующих. */
public enum LkAbsenceReportCampus {
    /** Казань — ZKBio. */
    KAZAN,
    /** Краснодар — общий Perco, зоны {@code Краснодар-*}. */
    KRASNODAR,
    /** Головной вуз — Perco (зоны без префикса Краснодар). Пока без сборки. */
    HEAD;

    public String sourceCode() {
        return switch (this) {
            case KAZAN -> "zkbio";
            case KRASNODAR -> "perco";
            case HEAD -> "perco-head";
        };
    }

    public String campusLabel() {
        return switch (this) {
            case KAZAN -> "Казань (ZKBio)";
            case KRASNODAR -> "Краснодар (Perco)";
            case HEAD -> "Голова (Perco)";
        };
    }

    public String pathSegment() {
        return name().toLowerCase(java.util.Locale.ROOT);
    }

    public static LkAbsenceReportCampus fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Укажите кампус: KAZAN, KRASNODAR или HEAD"
            );
        }
        String value = raw.trim().toUpperCase(java.util.Locale.ROOT);
        if ("KAZAN".equals(value) || "ZKBIO".equals(value)) {
            return KAZAN;
        }
        if ("KRASNODAR".equals(value) || "PERCO".equals(value)) {
            return KRASNODAR;
        }
        if ("HEAD".equals(value) || "GOLOVA".equals(value) || "PERCO-HEAD".equals(value)
            || "PERCO_HEAD".equals(value)) {
            return HEAD;
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST,
            "Кампус: KAZAN, KRASNODAR или HEAD"
        );
    }

    public static LkAbsenceReportCampus fromSource(String source) {
        if (source == null || source.isBlank()) {
            return KAZAN;
        }
        String value = source.trim().toLowerCase(java.util.Locale.ROOT);
        if ("perco".equals(value)) {
            return KRASNODAR;
        }
        if ("perco-head".equals(value) || "perco_head".equals(value)) {
            return HEAD;
        }
        return KAZAN;
    }
}
