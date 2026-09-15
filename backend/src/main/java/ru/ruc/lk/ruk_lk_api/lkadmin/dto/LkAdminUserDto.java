package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record LkAdminUserDto(
    String id,
    String username,
    String fullName,
    boolean active,
    boolean superAdmin,
    List<String> sections,
    String createdAt
) {}
