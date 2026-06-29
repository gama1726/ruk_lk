package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record ScheduleResponse(
    String group,
    String weekStart,
    String weekEnd,
    String anchorDate,
    String prevDate,
    String nextDate,
    List<ScheduleLessonResponse> lessons
) {}
