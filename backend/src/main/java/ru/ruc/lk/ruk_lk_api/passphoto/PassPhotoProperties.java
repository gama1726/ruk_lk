package ru.ruc.lk.ruk_lk_api.passphoto;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.pass-photo")
public record PassPhotoProperties(
    String storageDir,
    long maxSizeBytes,
    int minWidth,
    int minHeight,
    @DefaultValue("true") boolean mlEnabled,
    @DefaultValue("0.18") double minFaceHeightRatio,
    @DefaultValue("0.6") float faceScoreThreshold,
    /** Как часто студент может снова отправить фото после принятого (дни). */
    @DefaultValue("3") int resubmitCooldownDays
) {}
