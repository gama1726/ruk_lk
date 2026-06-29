package ru.ruc.lk.ruk_lk_api.integration.onec;

public record OneCGradebookItem(
    String semester,
    String periodControl,
    String studyYear,
    String course,
    String date,
    String displayDate,
    String discipline,
    String teacher,
    String controlType,
    int hours,
    int creditUnits,
    String grade
) {}
