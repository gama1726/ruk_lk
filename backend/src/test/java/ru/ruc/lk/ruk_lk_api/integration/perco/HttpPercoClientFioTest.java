package ru.ruc.lk.ruk_lk_api.integration.perco;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HttpPercoClientFioTest {

    @Test
    void splitsRussianFio() {
        HttpPercoClient.FioParts parts = HttpPercoClient.splitFio("Новгородцев Владимир Андреевич");
        assertEquals("Новгородцев", parts.lastName());
        assertEquals("Владимир", parts.firstName());
        assertEquals("Андреевич", parts.middleName());
    }

    @Test
    void splitsTwoParts() {
        HttpPercoClient.FioParts parts = HttpPercoClient.splitFio("Иванов Иван");
        assertEquals("Иванов", parts.lastName());
        assertEquals("Иван", parts.firstName());
        assertEquals("", parts.middleName());
    }
}
