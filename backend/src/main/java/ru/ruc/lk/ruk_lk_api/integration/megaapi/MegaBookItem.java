package ru.ruc.lk.ruk_lk_api.integration.megaapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Элемент ответа GetHandBooks / GetDebtBooks / GetOrderBooks.
 * Поля по примеру из Swagger (GetDebtBooks).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MegaBookItem(
    Object doc_id,
    String biblio,
    String getdate,
    String retdate,
    String bookpoint
) {
    public String docId() {
        if (doc_id == null) {
            return "";
        }
        return String.valueOf(doc_id);
    }
}
