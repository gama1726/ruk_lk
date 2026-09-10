package ru.ruc.lk.ruk_lk_api.events;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.metrics.ApiLoadMetrics;
import ru.ruc.lk.ruk_lk_api.metrics.OutboundLoadMetrics;
import ru.ruc.lk.ruk_lk_api.metrics.dto.ApiLoadSnapshotDto;
import ru.ruc.lk.ruk_lk_api.metrics.dto.OutboundLoadSnapshotDto;

@RestController
@RequestMapping("/api/admin/events/load")
public class EventsAdminLoadController {

    private final ApiLoadMetrics apiLoadMetrics;
    private final OutboundLoadMetrics outboundLoadMetrics;

    public EventsAdminLoadController(
        ApiLoadMetrics apiLoadMetrics,
        OutboundLoadMetrics outboundLoadMetrics
    ) {
        this.apiLoadMetrics = apiLoadMetrics;
        this.outboundLoadMetrics = outboundLoadMetrics;
    }

    @GetMapping
    public ApiLoadSnapshotDto load(HttpSession session) {
        EventsAdminAuthService.require(session);
        return snapshot();
    }

    @PostMapping("/reset")
    public ApiLoadSnapshotDto reset(HttpSession session) {
        EventsAdminAuthService.require(session);
        apiLoadMetrics.resetAll();
        outboundLoadMetrics.resetAll();
        return snapshot();
    }

    private ApiLoadSnapshotDto snapshot() {
        ApiLoadSnapshotDto inbound = apiLoadMetrics.snapshot();
        OutboundLoadSnapshotDto outbound = outboundLoadMetrics.snapshot();
        return new ApiLoadSnapshotDto(
            inbound.collectedAtMs(),
            inbound.windowSeconds(),
            inbound.totalInFlight(),
            inbound.totalRequestsPerMinute(),
            inbound.processStartedAtMs(),
            inbound.endpoints(),
            outbound.totalInFlight(),
            outbound.totalRequestsPerMinute(),
            outbound.calls(),
            outbound.recentErrors(),
            inbound.recentApiErrors()
        );
    }
}
