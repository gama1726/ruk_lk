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

    protected MaxBindToken() {}

    public MaxBindToken(String token, String studentId, Instant expiresAt) {
        this.token = token;
        this.studentId = studentId;
        this.expiresAt = expiresAt;
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

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }
}
