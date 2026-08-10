package ru.ruc.lk.ruk_lk_api.admin;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(
    @DefaultValue Spo spo,
    @DefaultValue He he
) {
    public record Spo(
        @DefaultValue("admin-spo") String username,
        @DefaultValue("") String password
    ) {}

    public record He(
        @DefaultValue("admin-he") String username,
        @DefaultValue("") String password
    ) {}
}
