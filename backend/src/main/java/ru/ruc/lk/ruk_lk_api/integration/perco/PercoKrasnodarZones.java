package ru.ruc.lk.ruk_lk_api.integration.perco;

import java.util.Locale;

/**
 * Зоны турникетов Краснодара в общем Perco (голова + Краснодар).
 * Имена вида {@code Краснодар-…}; улица — {@code Неконтролируемая территория}.
 */
public final class PercoKrasnodarZones {

    private PercoKrasnodarZones() {}

    public static boolean isKrasnodarZone(String zone) {
        if (zone == null || zone.isBlank()) {
            return false;
        }
        String normalized = zone.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("краснодар") || normalized.contains("краснодар");
    }

    /** Событие затрагивает Краснодар, если exit или enter — зона филиала. */
    public static boolean involvesKrasnodar(PercoAccessEvent event) {
        if (event == null) {
            return false;
        }
        return isKrasnodarZone(event.zoneExit()) || isKrasnodarZone(event.zoneEnter());
    }
}
