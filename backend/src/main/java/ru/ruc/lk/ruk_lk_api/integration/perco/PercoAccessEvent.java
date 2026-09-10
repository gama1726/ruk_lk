package ru.ruc.lk.ruk_lk_api.integration.perco;

/**
 * Событие прохода из УРВ {@code /taReports/eventsTable}
 * ({@code time_label}, {@code event_exit}, {@code event_enter}).
 */
public record PercoAccessEvent(
    Object id,
    String timeLabel,
    String zoneExit,
    String zoneEnter
) {
    public String resolvedTimeLabel() {
        return timeLabel == null || timeLabel.isBlank() ? null : timeLabel.trim();
    }

    public String resolvedGate() {
        if (zoneEnter != null && !zoneEnter.isBlank()) {
            return zoneEnter.trim();
        }
        if (zoneExit != null && !zoneExit.isBlank()) {
            return zoneExit.trim();
        }
        return null;
    }

    /**
     * Вход: из неконтролируемой → в контролируемую.
     * Выход: из контролируемой → в неконтролируемую.
     */
    public ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction resolveDirection(
        String uncontrolledZone
    ) {
        String marker = uncontrolledZone == null || uncontrolledZone.isBlank()
            ? "Неконтролируемая территория"
            : uncontrolledZone.trim();
        boolean fromUncontrolled = isUncontrolled(zoneExit, marker);
        boolean toUncontrolled = isUncontrolled(zoneEnter, marker);
        if (fromUncontrolled && !toUncontrolled) {
            return ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction.IN;
        }
        if (!fromUncontrolled && toUncontrolled) {
            return ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction.OUT;
        }
        return ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction.UNKNOWN;
    }

    public String resolvedDisplayGate(
        ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction direction
    ) {
        if (direction == ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction.IN
            && zoneEnter != null && !zoneEnter.isBlank()) {
            return zoneEnter.trim();
        }
        if (direction == ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction.OUT
            && zoneExit != null && !zoneExit.isBlank()) {
            return zoneExit.trim();
        }
        return resolvedGate();
    }

    private static boolean isUncontrolled(String zone, String marker) {
        if (zone == null || zone.isBlank()) {
            return false;
        }
        return zone.trim().equalsIgnoreCase(marker)
            || zone.toLowerCase(java.util.Locale.ROOT).contains("неконтролир");
    }
}
