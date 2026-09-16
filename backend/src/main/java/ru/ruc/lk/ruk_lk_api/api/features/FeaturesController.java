package ru.ruc.lk.ruk_lk_api.api.features;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/features")
public class FeaturesController {

    private final boolean attendanceEnabled;
    private final boolean startEnabled;

    public FeaturesController(
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled,
        @Value("${app.start.enabled:false}") boolean startEnabled
    ) {
        this.attendanceEnabled = attendanceEnabled;
        this.startEnabled = startEnabled;
    }

    @GetMapping
    public FeaturesDto features() {
        return new FeaturesDto(attendanceEnabled, startEnabled);
    }
}
