package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Элемент списка {@code GET /hs/student/order?studentId=...}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCOrderItem(
    String orderTitle,
    String orderType,
    String orderDocument,
    String orderNumber,
    String orderDate,
    String displayOrderDate,
    String startDate,
    String displayStartDate
) {}
