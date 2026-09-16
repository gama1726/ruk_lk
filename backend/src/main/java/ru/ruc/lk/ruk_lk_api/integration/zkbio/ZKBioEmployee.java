package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ZKBioEmployee(
    @JsonProperty("emp_code") String empCode,
    @JsonProperty("ssn") String ssn,
    @JsonProperty("national") String national,
    @JsonProperty("first_name") String firstName,
    @JsonProperty("last_name") String lastName
) {
    public String displayName() {
        String last = lastName == null ? "" : lastName.trim();
        String first = firstName == null ? "" : firstName.trim();
        String fio = (last + " " + first).trim();
        return fio.isEmpty() ? "" : fio;
    }
}
