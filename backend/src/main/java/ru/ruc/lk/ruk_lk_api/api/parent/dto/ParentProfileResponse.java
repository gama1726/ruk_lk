package ru.ruc.lk.ruk_lk_api.api.parent.dto;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.parent.dto.ParentProfileContractResponse;

public record ParentProfileResponse(
    String relation,
    String parentFullName,
    String parentEmail,
    String parentPhone,
    boolean isCustomer,
    boolean studentAdult,
    String studentId,
    String studentFullName,
    boolean dataAccessAllowed,
    String consentRequiredMessage,
    StudentProfileResponse student,
    int academicDebtCount,
    ParentProfileContractResponse contract
) {}
