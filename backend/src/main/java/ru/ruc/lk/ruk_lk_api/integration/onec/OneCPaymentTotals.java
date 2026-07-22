package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPaymentTotals(
    double scheduled,
    double scheduledDue,
    double paid,
    double debtOrAdvance,
    double debt,
    double advance,
    double penalty,
    double reportTotal,
    double totalToPay
) {}
