package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ZKBioAuthResponse(String token) {}
