package ru.ruc.lk.ruk_lk_api.events;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.events.dto.AdminAttendanceResponse;

@RestController
@RequestMapping("/api/admin/events/attendance")
public class EventsAdminAttendanceController {

    private final StudentService studentService;

    public EventsAdminAttendanceController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public AdminAttendanceResponse attendance(
        HttpSession session,
        @RequestParam String studentId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        EventsAdminAuthService.require(session);
        return studentService.getAttendanceForAdmin(session, studentId, from, to);
    }
}
