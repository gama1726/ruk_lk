package ru.ruc.lk.ruk_lk_api.integration.schedule;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ScheduleDateMeta(
    @JsonProperty("to_sch") String toSch,
    String type,
    String back,
    String next,
    int day,
    @JsonProperty("day_string") String dayString,
    int month,
    @JsonProperty("month_string") String monthString,
    int year,
    int monday,
    int sunday
) {}
