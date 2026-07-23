package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCCurriculumGroup(
    String title,
    int itemsCount,
    List<OneCCurriculumItem> items
) {}
