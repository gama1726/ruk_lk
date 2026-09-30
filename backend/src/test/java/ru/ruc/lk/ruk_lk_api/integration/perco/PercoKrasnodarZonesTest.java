package ru.ruc.lk.ruk_lk_api.integration.perco;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PercoKrasnodarZonesTest {

    @Test
    void krasnodarZoneNames() {
        assertTrue(PercoKrasnodarZones.isKrasnodarZone("Краснодар-Холл"));
        assertTrue(PercoKrasnodarZones.isKrasnodarZone("краснодар-вход"));
        assertFalse(PercoKrasnodarZones.isKrasnodarZone("Неконтролируемая территория"));
        assertFalse(PercoKrasnodarZones.isKrasnodarZone("Голова-1"));
        assertFalse(PercoKrasnodarZones.isKrasnodarZone(null));
    }

    @Test
    void involvesKrasnodarByEnterOrExit() {
        assertTrue(PercoKrasnodarZones.involvesKrasnodar(
            new PercoAccessEvent(1, "10:00", "Неконтролируемая территория", "Краснодар-Холл")
        ));
        assertTrue(PercoKrasnodarZones.involvesKrasnodar(
            new PercoAccessEvent(2, "18:00", "Краснодар-Холл", "Неконтролируемая территория")
        ));
        assertFalse(PercoKrasnodarZones.involvesKrasnodar(
            new PercoAccessEvent(3, "12:00", "Неконтролируемая территория", "Голова-1")
        ));
    }
}
