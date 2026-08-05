package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import java.util.List;
import java.util.Optional;

public interface MegaApiClient {

    boolean isEnabled();

    Optional<MegaReaderRecord> getReader(String rdrId);

    List<MegaBookItem> getHandBooks(String rdrId);

    List<MegaBookItem> getDebtBooks(String rdrId);

    List<MegaBookItem> getOrderBooks(String rdrId);
}
