package ru.ruc.lk.ruk_lk_api.api.parent;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.parent.dto.ParentProfileResponse;

import java.time.LocalDate;

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

    public StudentAttendanceResponse getAttendance(HttpSession session, LocalDate from, LocalDate to) {
        ParentSession parent = ParentAuthService.requireParent(session);
        ParentAuthService.requireDataAccess(parent);
        return studentService.getAttendanceForStudentId(session, parent.studentId(), from, to);
    }

    public StudentOrdersResponse getOrders(HttpSession session) {
        ParentSession parent = ParentAuthService.requireParent(session);
        ParentAuthService.requireDataAccess(parent);
        return studentService.getOrdersForStudentId(parent.studentId());
    }

    public StudentPaymentsResponse getPayments(HttpSession session, LocalDate date) {
        ParentSession parent = ParentAuthService.requireParent(session);
        ParentAuthService.requireDataAccess(parent);
        return studentService.getPaymentsForStudentId(parent.studentId(), date);
    }

    public ParentProfileResponse getProfile(HttpSession session) {
        ParentSession parent = ParentAuthService.requireParent(session);
        StudentProfileResponse studentProfile = null;
        if (parent.dataAccessAllowed()) {
            studentProfile = studentService.getProfileForStudentId(parent.studentId());
        }
        return new ParentProfileResponse(
            parent.relation(),
            parent.parentFullName(),
            parent.isCustomer(),
            parent.studentAdult(),
            parent.studentId(),
            parent.studentFullName(),
            parent.dataAccessAllowed(),
            parent.servicesBlocked() ? ParentAuthService.CONSENT_REQUIRED_MESSAGE : null,
            studentProfile
        );
    }
}
