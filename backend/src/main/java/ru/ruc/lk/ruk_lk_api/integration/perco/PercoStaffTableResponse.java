package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PercoStaffTableResponse(
    List<PercoStaffMember> rows,
    Integer page,
    Integer records,
    Integer total
) {
}
