package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Расписание за календарный месяц (один ответ вместо 4–6 недельных запросов). */
public record ScheduleMonthResponse(
    String group,
    int year,
    int month,
    List<ScheduleLessonResponse> lessons
) {}
