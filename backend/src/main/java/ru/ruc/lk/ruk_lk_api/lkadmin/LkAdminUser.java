package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_admin_user")
public class LkAdminUser {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 200)
    private String fullName;

    @Column(nullable = false)
    private boolean active = true;

    /** Супер-админ из конфига: все разделы, нельзя удалить через UI. */
    @Column(nullable = false)
    private boolean superAdmin = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lk_admin_user_section", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "section", nullable = false, length = 32)
    private Set<LkAdminSection> sections = new HashSet<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected LkAdminUser() {}

    public LkAdminUser(
        UUID id,
        String username,
        String passwordHash,
        String fullName,
        boolean superAdmin,
        Set<LkAdminSection> sections
    ) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.superAdmin = superAdmin;
        this.active = true;
        this.sections = sections == null ? new HashSet<>() : new HashSet<>(sections);
        this.createdAt = Instant.now();
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

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isSuperAdmin() {
        return superAdmin;
    }

    public Set<LkAdminSection> getSections() {
        return sections;
    }

    public void setSections(Set<LkAdminSection> sections) {
        this.sections = sections == null ? new HashSet<>() : new HashSet<>(sections);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean hasSection(LkAdminSection section) {
        if (superAdmin) {
            return true;
        }
        return sections != null && sections.contains(section);
    }
}
