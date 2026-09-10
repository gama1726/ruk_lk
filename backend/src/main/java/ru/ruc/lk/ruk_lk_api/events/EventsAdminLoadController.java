package ru.ruc.lk.ruk_lk_api.events;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.metrics.ApiLoadMetrics;
import ru.ruc.lk.ruk_lk_api.metrics.dto.ApiLoadSnapshotDto;

@RestController
@RequestMapping("/api/admin/events/load")
public class EventsAdminLoadController {

    private final ApiLoadMetrics apiLoadMetrics;

    public EventsAdminLoadController(ApiLoadMetrics apiLoadMetrics) {
        this.apiLoadMetrics = apiLoadMetrics;
    }

    @GetMapping
    public ApiLoadSnapshotDto load(HttpSession session) {
        EventsAdminAuthService.require(session);
        return apiLoadMetrics.snapshot();
    }
}
