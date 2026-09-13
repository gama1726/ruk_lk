package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import java.util.Locale;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction;

/**
 * Казань: направление по имени турникета.
 * «Ершова вход» / «Даурская вход» — вход; «Исаева выход» — выход.
 */
final class ZKBioDirectionResolver {

    private ZKBioDirectionResolver() {}

    static Direction fromGate(String terminalAlias, String areaAlias) {
        Direction fromTerminal = fromName(terminalAlias);
        if (fromTerminal != Direction.UNKNOWN) {
            return fromTerminal;
        }
        return fromName(areaAlias);
    }

    private static Direction fromName(String name) {
        if (name == null || name.isBlank()) {
            return Direction.UNKNOWN;
        }
        String normalized = name.toLowerCase(Locale.ROOT);
        if (normalized.contains("выход")) {
            return Direction.OUT;
        }
        if (normalized.contains("вход")) {
            return Direction.IN;
        }
        return Direction.UNKNOWN;
    }
}
