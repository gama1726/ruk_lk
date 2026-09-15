package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.events.dto.AdminAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminCreateRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminLoginRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminMeResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminUpdateRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminUserDto;

@RestController
@RequestMapping("/api/admin/lk")
public class LkAdminController {

    private final LkAdminAuthService authService;
    private final LkAdminUserService userService;
    private final StudentService studentService;

    public LkAdminController(
        LkAdminAuthService authService,
        LkAdminUserService userService,
        StudentService studentService
    ) {
        this.authService = authService;
        this.userService = userService;
        this.studentService = studentService;
    }

    @PostMapping("/auth/login")
    public LkAdminMeResponse login(HttpServletRequest request, @RequestBody LkAdminLoginRequest body) {
        return authService.login(request, body);
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(HttpSession session) {
        authService.logout(session);
        return Map.of("ok", "true");
    }

    @GetMapping("/auth/me")
    public LkAdminMeResponse me(HttpSession session) {
        return authService.me(session);
    }

    @GetMapping("/admins")
    public List<LkAdminUserDto> listAdmins(HttpSession session) {
        return userService.list(session);
    }

    @PostMapping("/admins")
    public LkAdminUserDto createAdmin(HttpSession session, @RequestBody LkAdminCreateRequest body) {
        return userService.create(session, body);
    }

    @PutMapping("/admins/{id}")
    public LkAdminUserDto updateAdmin(
        HttpSession session,
        @PathVariable UUID id,
        @RequestBody LkAdminUpdateRequest body
    ) {
        return userService.update(session, id, body);
    }

    @GetMapping("/attendance")
    public AdminAttendanceResponse attendance(
        HttpSession session,
        @RequestParam String studentId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ATTENDANCE);
        return studentService.getAttendanceForAdmin(session, studentId, from, to);
    }
}
