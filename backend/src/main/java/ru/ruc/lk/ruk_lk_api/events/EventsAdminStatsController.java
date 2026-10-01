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
import ru.ruc.lk.ruk_lk_api.cabinet.dto.CabinetUserPageResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminAuthService;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminSection;

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
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String campus
    ) {
        LkAdminAuthService.requireSection(session, LkAdminSection.CABINET_STATS);
        return cabinetUserService.stats(from, to, campus);
    }

    @GetMapping("/users")
    public CabinetUserPageResponse users(
        HttpSession session,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) String campus,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String q
    ) {
        LkAdminAuthService.requireSection(session, LkAdminSection.CABINET_STATS);
        return cabinetUserService.listUsers(page, size, campus, role, q);
    }
}
