package ru.ruc.lk.ruk_lk_api.api.parent;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;

@Service
public class ParentService {

    private final StudentService studentService;

    public ParentService(StudentService studentService) {
        this.studentService = studentService;
    }

    public ScheduleMonthResponse getScheduleMonth(HttpSession session, int year, int month) {
        ParentSession parent = ParentAuthService.requireParent(session);
        ParentAuthService.requireDataAccess(parent);
        return studentService.getScheduleMonthForStudentId(session, parent.studentId(), year, month);
    }

    public RecordBookResponse getRecordBook(HttpSession session) {
        ParentSession parent = ParentAuthService.requireParent(session);
        ParentAuthService.requireDataAccess(parent);
        return studentService.getRecordBookForStudentId(parent.studentId());
    }
}
