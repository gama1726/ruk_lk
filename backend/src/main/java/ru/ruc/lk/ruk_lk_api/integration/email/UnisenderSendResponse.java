package ru.ruc.lk.ruk_lk_api.integration.email;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UnisenderSendResponse(
    String status,
    String job_id
){}