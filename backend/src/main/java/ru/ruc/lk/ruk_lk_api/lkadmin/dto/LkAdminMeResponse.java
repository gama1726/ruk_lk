package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record LkAdminMeResponse(
    String id,
    String username,
    String fullName,
    boolean superAdmin,
    List<String> sections
) {}
