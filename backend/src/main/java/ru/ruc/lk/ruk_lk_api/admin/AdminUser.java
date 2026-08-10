package ru.ruc.lk.ruk_lk_api.admin;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

@Entity
@Table(name = "admin_user")
public class AdminUser {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    /** Зарезервировано; почта для админов не используется. */
    @Column(length = 200)
    private String email = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private EducationTrack role;

    @Column(nullable = false)
    private boolean active = true;

    protected AdminUser() {}

    public AdminUser(UUID id, String username, String passwordHash, EducationTrack role) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.email = "";
        this.role = role;
        this.active = true;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public EducationTrack getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
