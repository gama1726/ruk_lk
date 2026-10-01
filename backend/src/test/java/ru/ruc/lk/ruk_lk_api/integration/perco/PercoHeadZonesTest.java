package ru.ruc.lk.ruk_lk_api.integration.perco;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PercoHeadZonesTest {

    @Test
    void headStreetAndBuilding() {
        assertTrue(PercoHeadZones.involvesHead(
            new PercoAccessEvent(1, "10:00", "Неконтролируемая территория", "Главный вход")
        ));
        assertTrue(PercoHeadZones.involvesHead(
            new PercoAccessEvent(2, "18:00", "Корпус А", "Неконтролируемая территория")
        ));
        assertTrue(PercoHeadZones.involvesHead(
            new PercoAccessEvent(3, "12:00", "Корпус А", "Корпус Б")
        ));
    }

    @Test
    void krasnodarExcluded() {
        assertFalse(PercoHeadZones.involvesHead(
            new PercoAccessEvent(1, "10:00", "Неконтролируемая территория", "Краснодар-Холл")
        ));
        assertFalse(PercoHeadZones.involvesHead(
            new PercoAccessEvent(2, "11:00", "Краснодар-Холл", "Краснодар-2")
        ));
    }

    @Test
    void blankZonesRejected() {
        assertFalse(PercoHeadZones.involvesHead(new PercoAccessEvent(1, "10:00", null, "")));
        assertFalse(PercoHeadZones.involvesHead(null));
    }
}
