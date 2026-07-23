package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record CurriculumControlResponse(
    String type,
    int semester,
    String periodControl,
    int course,
    double hours
) {}
