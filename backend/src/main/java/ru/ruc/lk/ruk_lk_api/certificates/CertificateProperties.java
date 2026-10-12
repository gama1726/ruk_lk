package ru.ruc.lk.ruk_lk_api.certificates;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.certificates")
public record CertificateProperties(
    @DefaultValue("./data/certificates") String storageDir,
    /** Максимальный размер одного загружаемого файла (байты). */
    @DefaultValue("52428800") long maxSizeBytes,
    /** Максимум вложений на заявку. */
    @DefaultValue("5") int maxAttachments,
    /** Дней хранения после отклонения / отзыва / конца периода. */
    @DefaultValue("30") int retentionDays
) {}
