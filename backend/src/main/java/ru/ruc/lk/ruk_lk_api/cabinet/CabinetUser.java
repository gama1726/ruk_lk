package ru.ruc.lk.ruk_lk_api.cabinet;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cabinet_user")
public class CabinetUser {

    @Id
    @Column(length = 96)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CabinetUserRole role;

    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(length = 32)
    private String parentKey;

    @Column(nullable = false, length = 240)
    private String displayName;

    /**
     * Id филиала из {@link ru.ruc.lk.ruk_lk_api.api.student.UniversityBranchCatalog}
     * ({@code main}, {@code kazan}, …). Null — ещё не определён.
     */
    @Column(length = 32)
    private String campus;

    @Column(nullable = false)
    private Instant firstLoginAt;

    @Column(nullable = false)
    private Instant lastLoginAt;

    @Column(nullable = false)
    private Instant lastSeenAt;

    protected CabinetUser() {}

    public CabinetUser(
        String id,
        CabinetUserRole role,
        String studentId,
        String parentKey,
        String displayName,
        String campus,
        Instant at
    ) {
        this.id = id;
        this.role = role;
        this.studentId = studentId;
        this.parentKey = parentKey;
        this.displayName = displayName;
        this.campus = campus;
        this.firstLoginAt = at;
        this.lastLoginAt = at;
        this.lastSeenAt = at;
    }

    public String getId() {
        return id;
    }

    public CabinetUserRole getRole() {
        return role;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getParentKey() {
        return parentKey;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getCampus() {
        return campus;
    }

    public void setCampus(String campus) {
        this.campus = campus;
    }

    public Instant getFirstLoginAt() {
        return firstLoginAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(Instant lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }
}
