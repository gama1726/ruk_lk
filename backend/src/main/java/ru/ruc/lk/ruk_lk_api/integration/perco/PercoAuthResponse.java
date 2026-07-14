package ru.ruc.lk.ruk_lk_api.integration.perco;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PercoAuthResponse(String token) {}
