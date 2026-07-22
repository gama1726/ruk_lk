package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code GET /hs/student/order?studentId=...}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCOrdersResponse(
    boolean found,
    String studentId,
    String studentFullName,
    List<OneCOrderItem> orders
) {}
