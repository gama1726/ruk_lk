package ru.ruc.lk.ruk_lk_api.events;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.events-admin")
public record EventsAdminProperties(
    @DefaultValue("events-admin") String username,
    @DefaultValue("") String password
) {}
