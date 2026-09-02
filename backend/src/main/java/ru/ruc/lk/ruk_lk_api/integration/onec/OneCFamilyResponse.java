package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Ответ {@code POST /hs/student/parent/check}. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCFamilyResponse(
    boolean found,
    String studentId,
    String studentFullName,
    boolean studentAdult,
    boolean parentsFound,
    int parentsCount,
    List<OneCParentMember> parents
) {}
