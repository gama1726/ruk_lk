package ru.ruc.lk.ruk_lk_api.api.student.dto;

public record ScheduleLessonResponse(
    String id,
    String date,
    String subject,
    String kind,
    String start,
    String end,
    String room,
    String teacher,
    String groupName,
    String status
) {}
