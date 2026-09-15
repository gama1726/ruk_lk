package ru.ruc.lk.ruk_lk_api.lkadmin;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.lk-admin")
public record LkAdminProperties(
    @DefaultValue("lk-admin") String username,
    @DefaultValue("") String password,
    @DefaultValue("Супер-администратор ЛК") String fullName
) {}
