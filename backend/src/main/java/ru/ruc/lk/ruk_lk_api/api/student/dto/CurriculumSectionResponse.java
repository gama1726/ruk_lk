package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record CurriculumSectionResponse(
    String code,
    String title,
    int itemsCount,
    List<CurriculumGroupResponse> groups
) {}
