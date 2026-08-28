package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ZKBioTransactionsResponse(
    Integer count,
    List<ZKBioTransaction> data
) {}
