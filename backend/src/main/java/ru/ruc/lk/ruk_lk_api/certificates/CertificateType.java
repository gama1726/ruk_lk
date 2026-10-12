package ru.ruc.lk.ruk_lk_api.certificates;

public enum CertificateType {
    SICK_LEAVE,
    MILITARY_EXEMPTION,
    OTHER;

    public String labelRu() {
        return switch (this) {
            case SICK_LEAVE -> "Больничный";
            case MILITARY_EXEMPTION -> "Освобождение от военкомата";
            case OTHER -> "Прочее";
        };
    }

    public static CertificateType fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Укажите тип справки"
            );
        }
        try {
            return CertificateType.valueOf(raw.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Тип: SICK_LEAVE, MILITARY_EXEMPTION или OTHER"
            );
        }
    }
}
