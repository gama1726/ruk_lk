package ru.ruc.lk.ruk_lk_api.integration.perco;

/**
 * Зоны головного вуза в общем Perco (голова + Краснодар).
 * Голова = любое событие с зонами, которое не затрагивает {@code Краснодар-*}.
 */
public final class PercoHeadZones {

    private PercoHeadZones() {}

    /**
     * Событие головы: есть имена зон и ни exit, ни enter не относятся к Краснодару.
     */
    public static boolean involvesHead(PercoAccessEvent event) {
        if (event == null) {
            return false;
        }
        if (PercoKrasnodarZones.involvesKrasnodar(event)) {
            return false;
        }
        boolean hasExit = event.zoneExit() != null && !event.zoneExit().isBlank();
        boolean hasEnter = event.zoneEnter() != null && !event.zoneEnter().isBlank();
        return hasExit || hasEnter;
    }
}
