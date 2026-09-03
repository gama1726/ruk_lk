package ru.ruc.lk.ruk_lk_api.events;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventDto;
import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventWriteRequest;

@RestController
@RequestMapping("/api/admin/events")
public class EventsAdminCrudController {

    private final EventService eventService;

    public EventsAdminCrudController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<CampusEventDto> list(HttpSession session) {
        EventsAdminAuthService.require(session);
        return eventService.listAllForAdmin();
    }

    @PostMapping
    public CampusEventDto create(@RequestBody CampusEventWriteRequest body, HttpSession session) {
        EventsAdminAuthService.require(session);
        return eventService.create(body);
    }

    @PutMapping("/{id}")
    public CampusEventDto update(
        @PathVariable UUID id,
        @RequestBody CampusEventWriteRequest body,
        HttpSession session
    ) {
        EventsAdminAuthService.require(session);
        return eventService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable UUID id, HttpSession session) {
        EventsAdminAuthService.require(session);
        eventService.delete(id);
        return Map.of("ok", "true");
    }
}
