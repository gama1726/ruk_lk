package ru.ruc.lk.ruk_lk_api.passphoto;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.pass-photo")
public record PassPhotoProperties(
    String storageDir,
    /** Максимальный размер загружаемого файла (байты). */
    long maxSizeBytes,
    int minWidth,
    int minHeight,
    @DefaultValue("true") boolean mlEnabled,
    @DefaultValue("0.18") double minFaceHeightRatio,
    @DefaultValue("0.6") float faceScoreThreshold,
    /** Как часто студент может снова отправить фото после принятого (дни). */
    @DefaultValue("3") int resubmitCooldownDays,
    /** TTL кэша успешного /validate для пропуска повторного ML на upload (сек). */
    @DefaultValue("300") int validateCacheTtlSeconds,
    /** Длинная сторона JPEG на диске (админка / дальнейший ресайз в Perco). */
    @DefaultValue("2000") int storageMaxEdgePx,
    /** Качество JPEG при сохранении (0..1). */
    @DefaultValue("0.85") float storageJpegQuality,
    /** Потолок размера после нормализации (байты). */
    @DefaultValue("5242880") long storageMaxBytes
) {}
