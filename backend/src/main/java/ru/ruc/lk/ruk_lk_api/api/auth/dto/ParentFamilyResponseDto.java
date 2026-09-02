package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import java.util.List;

public record ParentFamilyResponseDto(
    String studentId,
    String studentFullName,
    boolean studentAdult,
    List<ParentMemberOptionDto> members
) {}
