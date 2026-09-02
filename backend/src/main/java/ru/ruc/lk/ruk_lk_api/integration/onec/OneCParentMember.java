package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OneCParentMember(
    String relation,
    String fullName,
    String email,
    List<String> phones,
    boolean isCustomer,
    boolean servicesBlocked
) {}
