package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.util.List;
import java.util.Map;

public record ScheduleWeekApiResponse(
    Map<String, List<ScheduleApiLesson>> schedule,
    ScheduleDateMeta date
) {}
