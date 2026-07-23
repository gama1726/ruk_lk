package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record CurriculumItemResponse(
    String id,
    String typeRecord,
    String title,
    double totalHours,
    double auditoryHours,
    double independentHours,
    double lectureHours,
    double practiceHours,
    double laboratoryHours,
    double creditUnits,
    List<Integer> semesters,
    String controlLabel,
    List<CurriculumControlResponse> controls
) {}
