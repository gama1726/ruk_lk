package ru.ruc.lk.ruk_lk_api.events;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

class EventCampusResolverTest {

    @Test
    void kazanParentSeesKazanCampus() {
        Optional<EventCampus> campus = EventCampusResolver.resolve(profile(
            "Казанский кооперативный институт (филиал)",
            null,
            null,
            "ТД1-О/кз25"
        ));
        assertEquals(Optional.of(EventCampus.KAZAN), campus);
    }

    @Test
    void headParentSeesHeadCampus() {
        Optional<EventCampus> campus = EventCampusResolver.resolve(profile(
            "Российский университет кооперации",
            "Факультет",
            null,
            "ИС-21"
        ));
        assertEquals(Optional.of(EventCampus.HEAD), campus);
    }

    @Test
    void otherBranchHasNoEventsCampus() {
        Optional<EventCampus> campus = EventCampusResolver.resolve(profile(
            "Краснодарский кооперативный институт (филиал)",
            null,
            null,
            "ТД1"
        ));
        assertTrue(campus.isEmpty());
    }

    private static OneCProfileResponse profile(
        String branch,
        String faculty,
        String department,
        String group
    ) {
        return new OneCProfileResponse(
            "1",
            "Иванов Иван",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            faculty,
            branch,
            null,
            null,
            null,
            null,
            null,
            null,
            department,
            group,
            null,
            null
        );
    }
}
