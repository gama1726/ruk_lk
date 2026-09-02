package ru.ruc.lk.ruk_lk_api.api.parent;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.parent.dto.ParentProfileContractResponse;
import ru.ruc.lk.ruk_lk_api.api.parent.dto.ParentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.StudentService;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.ScheduleMonthResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentContractResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;

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
        int academicDebtCount = -1;
        ParentProfileContractResponse contract = null;

        if (parent.dataAccessAllowed()) {
            studentProfile = studentService.getProfileForStudentId(parent.studentId());
            academicDebtCount = loadAcademicDebtCount(parent.studentId());
            contract = loadContract(parent.studentId(), studentProfile, parent.isCustomer());
        }

        return new ParentProfileResponse(
            parent.relation(),
            parent.parentFullName(),
            blankToNull(parent.parentEmail()),
            blankToNull(parent.parentPhone()),
            parent.isCustomer(),
            parent.studentAdult(),
            parent.studentId(),
            parent.studentFullName(),
            parent.dataAccessAllowed(),
            parent.servicesBlocked() ? ParentAuthService.CONSENT_REQUIRED_MESSAGE : null,
            studentProfile,
            academicDebtCount,
            contract
        );
    }

    private int loadAcademicDebtCount(String studentId) {
        try {
            RecordBookResponse book = studentService.getRecordBookForStudentId(studentId);
            return book.failedCount();
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return 0;
            }
            throw ex;
        }
    }

    private ParentProfileContractResponse loadContract(
        String studentId,
        StudentProfileResponse studentProfile,
        boolean isCustomer
    ) {
        try {
            StudentPaymentsResponse payments = studentService.getPaymentsForStudentId(studentId, LocalDate.now());
            StudentPaymentContractResponse raw = payments.contract();
            String funding = studentProfile != null ? blankToEmpty(studentProfile.funding()) : "";
            if (funding.isBlank() && payments.paymentFound()) {
                funding = "Полное возмещение затрат";
            }
            return new ParentProfileContractResponse(
                funding,
                isCustomer ? "Заказчик / плательщик" : "—",
                payments.status(),
                paymentStatusLabel(payments.status()),
                raw != null ? blankToEmpty(raw.number()) : "",
                raw != null ? blankToEmpty(raw.date()) : "",
                raw != null ? blankToEmpty(raw.displayDate()) : ""
            );
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                String funding = studentProfile != null ? blankToEmpty(studentProfile.funding()) : "";
                if (funding.isBlank()) {
                    return null;
                }
                return new ParentProfileContractResponse(
                    funding,
                    isCustomer ? "Заказчик / плательщик" : "—",
                    "",
                    "",
                    "",
                    "",
                    ""
                );
            }
            throw ex;
        }
    }

    private static String paymentStatusLabel(String status) {
        if (status == null || status.isBlank()) {
            return "";
        }
        return switch (status) {
            case "ok" -> "Действует";
            case "due" -> "Ожидается платёж";
            case "overdue" -> "Просрочка";
            default -> status;
        };
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
