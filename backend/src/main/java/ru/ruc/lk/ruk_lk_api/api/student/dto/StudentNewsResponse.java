package ru.ruc.lk.ruk_lk_api.api.student.dto;

import java.util.List;

/** Ответ {@code GET /api/student/news}. */
public record StudentNewsResponse(
    /** ok | unavailable */
    String status,
    List<StudentNewsItemResponse> items
) {
    public record StudentNewsItemResponse(
        String id,
        String title,
        String preview,
        String date,
        String url,
        String imageUrl
    ) {}
}
