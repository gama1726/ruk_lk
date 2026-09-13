package ru.ruc.lk.ruk_lk_api.integration.zkbio;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.integration.skud.SkudAccessEvent.Direction;

class ZKBioDirectionResolverTest {

    @Test
    void entryTurnstilesAreIn() {
        assertEquals(Direction.IN, ZKBioDirectionResolver.fromGate("Ершова вход", "KCI"));
        assertEquals(Direction.IN, ZKBioDirectionResolver.fromGate("Ершова вход времянка", "KCI"));
        assertEquals(Direction.IN, ZKBioDirectionResolver.fromGate("Даурская вход", "KCI"));
    }

    @Test
    void exitTurnstilesAreOut() {
        assertEquals(Direction.OUT, ZKBioDirectionResolver.fromGate("Исаева выход", "KCI"));
        assertEquals(Direction.OUT, ZKBioDirectionResolver.fromGate("Даурская выход", "KCI"));
        assertEquals(Direction.OUT, ZKBioDirectionResolver.fromGate("Ершова выход", "KCI"));
    }

    @Test
    void unknownWhenNameHasNoHint() {
        assertEquals(Direction.UNKNOWN, ZKBioDirectionResolver.fromGate("KCI", null));
        assertEquals(Direction.UNKNOWN, ZKBioDirectionResolver.fromGate(null, null));
    }
}
