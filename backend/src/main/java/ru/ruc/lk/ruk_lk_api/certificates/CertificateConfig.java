package ru.ruc.lk.ruk_lk_api.certificates;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CertificateProperties.class)
public class CertificateConfig {}
