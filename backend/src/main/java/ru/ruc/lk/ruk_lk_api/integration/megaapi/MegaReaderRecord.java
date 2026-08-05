package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Учётная запись читателя (GetReader / формат ReaderData).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MegaReaderRecord(
    @JsonProperty("RDR_ID") String rdrId,
    @JsonProperty("NAME") String name,
    @JsonProperty("CODE") String code,
    @JsonProperty("BIRTHDAY") String birthday,
    @JsonProperty("FACULTY") String faculty,
    @JsonProperty("COUNTRY") String country
) {}
