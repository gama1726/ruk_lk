package ru.ruc.lk.ruk_lk_api.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import ru.ruc.lk.ruk_lk_api.integration.perco.PercoProperties;

@Configuration
@EnableConfigurationProperties(PercoProperties.class)
public class PercoConfig {}
