package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record CurriculumGroupResponse(
    String title,
    int itemsCount,
    List<CurriculumItemResponse> items
) {}
