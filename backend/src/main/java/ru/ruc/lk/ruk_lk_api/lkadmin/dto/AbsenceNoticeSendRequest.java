package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

/** Ручная отправка уведомления о непосещаемости по одной строке отчёта. */
public record AbsenceNoticeSendRequest(
    String date,
    String studentId,
    String fullName
) {}
