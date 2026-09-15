package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record AbsenceReportRequest(
    String date,
    String group,
    List<String> studentIds,
    Boolean saveRoster
) {}
