package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record LkAdminUpdateRequest(
    String fullName,
    String password,
    Boolean active,
    List<String> sections
) {}
