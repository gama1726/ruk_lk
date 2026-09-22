package ru.ruc.lk.ruk_lk_api.integration.perco;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Ответ {@code PUT /api/users/staff} (создание). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PercoStaffCreateResponse(
    Integer id,
    String error
) {}
