package ru.ruc.lk.ruk_lk_api.api.features;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/features")
public class FeaturesController {

    private final boolean attendanceEnabled;

    public FeaturesController(@Value("${app.attendance.enabled:false}") boolean attendanceEnabled) {
        this.attendanceEnabled = attendanceEnabled;
    }

    @GetMapping
    public FeaturesDto features() {
        return new FeaturesDto(attendanceEnabled);
    }
}
