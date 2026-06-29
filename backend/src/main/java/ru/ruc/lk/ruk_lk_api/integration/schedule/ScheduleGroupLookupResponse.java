package ru.ruc.lk.ruk_lk_api.integration.schedule;

public record ScheduleGroupLookupResponse(
    ScheduleGroupRef group,
    ScheduleBranchRef branch
) {}
