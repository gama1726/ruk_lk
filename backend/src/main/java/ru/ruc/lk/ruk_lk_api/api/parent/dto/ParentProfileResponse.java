package ru.ruc.lk.ruk_lk_api.api.parent.dto;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;

public record ParentProfileResponse(
    String relation,
    String parentFullName,
    boolean isCustomer,
    boolean studentAdult,
    String studentId,
    String studentFullName,
    boolean dataAccessAllowed,
    String consentRequiredMessage,
    StudentProfileResponse student
) {}
