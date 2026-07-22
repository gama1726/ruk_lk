package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPaymentContract(
    String presentation,
    String number,
    String date,
    String displayDate,
    String type,
    String objectType
) {}
