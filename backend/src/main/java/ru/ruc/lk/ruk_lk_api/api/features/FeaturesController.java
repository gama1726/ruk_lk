package ru.ruc.lk.ruk_lk_api.api.features;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;

@RestController
@RequestMapping("/api/features")
public class FeaturesController {

    private final boolean attendanceEnabled;
    private final boolean startEnabled;
    private final boolean startShowInLk;
    private final PreviewStudents previewStudents;

    public FeaturesController(
        @Value("${app.attendance.enabled:false}") boolean attendanceEnabled,
        @Value("${app.start.enabled:false}") boolean startEnabled,
        @Value("${app.start.show-in-lk:false}") boolean startShowInLk,
        PreviewStudents previewStudents
    ) {
        this.attendanceEnabled = attendanceEnabled;
        this.startEnabled = startEnabled;
        this.startShowInLk = startShowInLk;
        this.previewStudents = previewStudents;
    }

    @GetMapping
    public FeaturesDto features(HttpSession session) {
        return new FeaturesDto(
            attendanceEnabled,
            startEnabled,
            startShowInLk,
            resolvePreview(session)
        );
    }

    private boolean resolvePreview(HttpSession session) {
        if (session == null) {
            return false;
        }
        Object student = session.getAttribute("STUDENT");
        if (student instanceof StudentSession s) {
            return previewStudents.isPreviewStudent(s.studentId());
        }
        Object parent = session.getAttribute(ParentAuthService.SESSION_KEY);
        if (parent instanceof ParentSession p) {
            return previewStudents.isPreviewStudent(p.studentId());
        }
        return false;
    }
}
