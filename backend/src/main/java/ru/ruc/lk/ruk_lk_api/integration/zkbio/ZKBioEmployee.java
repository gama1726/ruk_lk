package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ZKBioEmployee(
    @JsonProperty("emp_code") String empCode,
    @JsonProperty("ssn") String ssn,
    /** «Нац. имя» в UI — часто номер зачётки. */
    @JsonProperty("national") String national
) {}
