package ru.ruc.lk.ruk_lk_api.integration.schedule;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ScheduleApiLesson(
    @JsonProperty("FilialGUID") String filialGuid,
    @JsonProperty("Data") String data,
    @JsonProperty("DayOFWeek") String dayOfWeek,
    @JsonProperty("Time") String time,
    @JsonProperty("Time_start") String timeStart,
    @JsonProperty("Time_end") String timeEnd,
    @JsonProperty("Group") String group,
    @JsonProperty("SubGroup") String subGroup,
    @JsonProperty("Type") String type,
    @JsonProperty("Discipline") String discipline,
    @JsonProperty("Employee") String employee,
    @JsonProperty("Classroom") String classroom
) {}
