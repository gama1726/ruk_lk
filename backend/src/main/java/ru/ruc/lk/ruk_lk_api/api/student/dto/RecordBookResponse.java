package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

public record RecordBookResponse(
    String studentId,
    List<Integer> semesters,
    List<RecordBookEntryResponse> items
) {}
