package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.Locale;

/** Головной кампус vs филиал (по тексту из 1С). */
final class CampusSupport {

    private CampusSupport() {}

    static boolean isBranchCampus(String... parts) {
        for (String part : parts) {
            if (part != null && part.toLowerCase(Locale.ROOT).contains("филиал")) {
                return true;
            }
        }
        return false;
    }
}
