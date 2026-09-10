package ru.ruc.lk.ruk_lk_api.events;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.cabinet.CabinetUserService;
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetStatsResponse;

@RestController
@RequestMapping("/api/admin/events/stats")
public class EventsAdminStatsController {

    private final CabinetUserService cabinetUserService;

    public EventsAdminStatsController(CabinetUserService cabinetUserService) {
        this.cabinetUserService = cabinetUserService;
    }

    @GetMapping
    public CabinetStatsResponse stats(
        HttpSession session,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        EventsAdminAuthService.require(session);
        return cabinetUserService.stats(from, to);
    }
}
