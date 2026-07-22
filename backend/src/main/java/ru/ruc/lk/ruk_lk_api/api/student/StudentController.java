package ru.ruc.lk.ruk_lk_api.api.student;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;

import jakarta.servlet.http.HttpSession;

import java.time.LocalDate;


@RestController
@RequestMapping("/api/student")
public class StudentController{

    private final StudentService studentService;

    public StudentController(StudentService studentService){
        this.studentService = studentService;
    }
    @GetMapping("/profile")
    public StudentProfileResponse profile(HttpSession session) {
        return studentService.getProfile(session);
    }

    @GetMapping("/record-book")
    public RecordBookResponse recordBook(HttpSession session) {
        return studentService.getRecordBook(session);
    }

    @GetMapping("/orders")
    public StudentOrdersResponse orders(HttpSession session) {
        return studentService.getOrders(session);
    }

    @GetMapping("/schedule")
    public ScheduleResponse schedule(
        HttpSession session,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return studentService.getSchedule(session, date);
    }
}