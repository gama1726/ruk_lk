package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCCurriculumItem(
    String section,
    String group,
    String typeRecord,
    String block,
    String title,
    Double totalHours,
    Double auditoryHours,
    Double independentHours,
    Double lectureHours,
    Double practiceHours,
    Double laboratoryHours,
    Double consultationHours,
    Double assessmentContactHours,
    Double controlHours,
    Double creditUnits,
    List<Integer> semesters,
    List<OneCCurriculumControl> controls,
    List<String> studyPlans
) {}
