package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.LocalTime;

/** Очная пара из расписания для расчёта посещаемости. */
record CampusLesson(
    LocalDate date,
    LocalTime start,
    LocalTime end,
    String subject,
    String classroom
) {}
