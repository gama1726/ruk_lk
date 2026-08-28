package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** ZKBio — Казанский филиал ККИ (посещаемость). */
@ConfigurationProperties(prefix = "app.zkbio.kazan")
public record ZKBioProperties(
    boolean enabled,
    String baseUrl,
    String login,
    String password,
    boolean trustSelfSigned
) {}
