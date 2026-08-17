package ru.ruc.lk.ruk_lk_api.integration.max;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_max_binding")
public class StudentMaxBinding {

    @Id
    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false, unique = true)
    private Long maxUserId;

    @Column(nullable = false)
    private Instant boundAt;

    /** 10 цифр без +7 — телефон, с которым подтверждена привязка. */
    @Column(length = 16)
    private String verifiedPhoneNorm;

    protected StudentMaxBinding() {}

    public StudentMaxBinding(String studentId, Long maxUserId, Instant boundAt, String verifiedPhoneNorm) {
        this.studentId = studentId;
        this.maxUserId = maxUserId;
        this.boundAt = boundAt;
        this.verifiedPhoneNorm = verifiedPhoneNorm;
    }

    public String getStudentId() {
        return studentId;
    }

    public Long getMaxUserId() {
        return maxUserId;
    }

    public Instant getBoundAt() {
        return boundAt;
    }

    public String getVerifiedPhoneNorm() {
        return verifiedPhoneNorm;
    }

    public void rebind(Long maxUserId, Instant boundAt, String verifiedPhoneNorm) {
        this.maxUserId = maxUserId;
        this.boundAt = boundAt;
        this.verifiedPhoneNorm = verifiedPhoneNorm;
    }

    public void captureVerifiedPhone(String verifiedPhoneNorm) {
        this.verifiedPhoneNorm = verifiedPhoneNorm;
    }
}
