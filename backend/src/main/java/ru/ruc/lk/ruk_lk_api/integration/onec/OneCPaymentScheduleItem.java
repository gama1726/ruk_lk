package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPaymentScheduleItem(
    int number,
    String studyYear,
    String course,
    String periodControl,
    String date,
    String displayDate,
    double scheduled,
    double paid,
    double debtOrAdvance,
    double debt,
    double advance,
    double penalty,
    int debtDays,
    double total,
    String contract,
    String scheduleSource
) {}
