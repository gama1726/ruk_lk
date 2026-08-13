package ru.ruc.lk.ruk_lk_api.integration.max;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "max_bind_token")
public class MaxBindToken {

    @Id
    @Column(nullable = false, length = 64)
    private String token;

    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false)
    private Instant expiresAt;

    /** 10 цифр без +7 — телефон из 1С для сверки с MAX. */
    @Column(length = 16)
    private String expectedPhoneNorm;

    /** MAX user_id после bot_started, до подтверждения контакта. */
    private Long pendingMaxUserId;

    protected MaxBindToken() {}

    public MaxBindToken(String token, String studentId, Instant expiresAt, String expectedPhoneNorm) {
        this.token = token;
        this.studentId = studentId;
        this.expiresAt = expiresAt;
        this.expectedPhoneNorm = expectedPhoneNorm;
    }

    public String getToken() {
        return token;
    }

    public String getStudentId() {
        return studentId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public String getExpectedPhoneNorm() {
        return expectedPhoneNorm;
    }

    public Long getPendingMaxUserId() {
        return pendingMaxUserId;
    }

    public void setPendingMaxUserId(Long pendingMaxUserId) {
        this.pendingMaxUserId = pendingMaxUserId;
    }

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
