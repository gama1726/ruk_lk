package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code GET /hs/student/payments?studentId=...&date=...&showAll=true}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCPaymentsResponse(
    boolean studentFound,
    boolean paymentFound,
    String studentId,
    String studentFullName,
    String asOfDate,
    boolean showAllSchedule,
    int contractsCount,
    List<OneCPaymentContract> contracts,
    int scheduleSourcesCount,
    List<OneCPaymentScheduleSource> scheduleSources,
    int scheduleCount,
    int paymentsCount,
    OneCPaymentTotals totals,
    List<OneCPaymentScheduleItem> schedule
) {}
