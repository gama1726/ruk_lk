package ru.ruc.lk.ruk_lk_api.events;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventDto;

@RestController
@RequestMapping("/api/events")
public class EventsController {

    private final EventService eventService;

    public EventsController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<CampusEventDto> listForMonth(
        @RequestParam int year,
        @RequestParam int month
    ) {
        return eventService.listPublishedForMonth(year, month);
    }
}
