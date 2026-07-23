package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCGradebookItem(
    Object semester,
    String periodControl,
    String studyYear,
    Object course,
    String date,
    String displayDate,
    String discipline,
    String teacher,
    String controlType,
    Double hours,
    Double creditUnits,
    String grade,
    String disciplineFullName,
    String displayDiscipline,
    String block,
    Double hoursTotal,
    Double hoursContact,
    String sheetNumber,
    String sheet,
    String studyPlan,
    Integer rowNumber,
    Boolean practice,
    String status,
    String statusTitle,
    Boolean hasResult,
    Boolean planned,
    Boolean passed,
    Boolean failed
) {}
