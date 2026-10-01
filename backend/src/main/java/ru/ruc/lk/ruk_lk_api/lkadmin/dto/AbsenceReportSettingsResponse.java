package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record AbsenceReportSettingsResponse(
    String autoCron,
    List<AbsenceReportCampusSettingsDto> campuses
) {}
