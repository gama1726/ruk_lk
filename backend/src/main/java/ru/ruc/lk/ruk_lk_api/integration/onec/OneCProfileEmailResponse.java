package ru.ruc.lk.ruk_lk_api.integration.onec;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Ответ {@code POST /hs/student/profileEmail}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCProfileEmailResponse(
    boolean success,
    String studentId,
    String studentFullName,
    String recordBook,
    String oldEmail,
    String email,
    String contactInfoType,
    boolean emailChanged,
    Integer emailRowsBefore,
    Integer emailRowsAfter,
    Integer removedDuplicates,
    String message
) {}
