package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record LkAdminCreateRequest(
    String fullName,
    String username,
    String password,
    List<String> sections
) {}
