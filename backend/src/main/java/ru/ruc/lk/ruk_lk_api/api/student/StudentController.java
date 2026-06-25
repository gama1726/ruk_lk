package ru.ruc.lk.ruk_lk_api.api.student;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;

import jakarta.servlet.http.HttpSession;


@RestController
@RequestMapping("/api/student")
public class StudentController{

    private final StudentService studentService;

    public StudentController(StudentService studentService){
        this.studentService = studentService;
    }
    @GetMapping("/profile")
    public StudentProfileResponse profile(HttpSession session){
        return studentService.getProfile(session);
}
}