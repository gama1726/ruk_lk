package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCCurriculumSection(
    String code,
    String title,
    int itemsCount,
    List<OneCCurriculumGroup> groups
) {}
