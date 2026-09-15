package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

public record ParentNoticeRequest(
    String date,
    String studentId,
    boolean notified
) {}
