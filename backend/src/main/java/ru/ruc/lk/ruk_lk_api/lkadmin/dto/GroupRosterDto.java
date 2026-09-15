package ru.ruc.lk.ruk_lk_api.lkadmin.dto;

import java.util.List;

public record GroupRosterDto(
    String groupName,
    List<String> studentIds,
    String updatedAt
) {}
