package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCCurriculumControl(
    String type,
    Integer semester,
    String periodControl,
    Integer course,
    Double hours
) {}
