package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ZKBioTransaction(
    @JsonProperty("emp_code") String empCode,
    @JsonProperty("punch_time") String punchTime,
    @JsonProperty("terminal_alias") String terminalAlias,
    @JsonProperty("area_alias") String areaAlias
) {}
