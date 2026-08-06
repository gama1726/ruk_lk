package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Учётная запись читателя (GetReader).
 * На стенде ilibrary поля: {@code id}, {@code fio}; в swagger — {@code RDR_ID}, {@code NAME}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MegaReaderRecord(
    @JsonProperty("id")
    @JsonAlias({"RDR_ID", "rdr_id"})
    String rdrId,

    @JsonProperty("fio")
    @JsonAlias({"NAME", "name", "FIO"})
    String name,

    @JsonProperty("CODE")
    @JsonAlias({"code"})
    String code,

    @JsonProperty("BIRTHDAY")
    @JsonAlias({"birthday"})
    String birthday,

    @JsonProperty("FACULTY")
    @JsonAlias({"faculty"})
    String faculty,

    @JsonProperty("COUNTRY")
    @JsonAlias({"country"})
    String country
) {}
