package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record AbsenceReportSettingsUpdateRequest(
    List<CampusToggle> campuses
) {
    public record CampusToggle(
        String campus,
        Boolean autoEnabled,
        Boolean notifyEnabled
    ) {}
}
