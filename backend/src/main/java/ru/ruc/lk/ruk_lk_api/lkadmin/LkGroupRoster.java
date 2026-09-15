package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "lk_group_roster")
public class LkGroupRoster {

    @Id
    @Column(length = 200)
    private String groupName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lk_group_roster_student", joinColumns = @JoinColumn(name = "group_name"))
    @Column(name = "student_id", nullable = false, length = 64)
    @OrderColumn(name = "ord")
    private List<String> studentIds = new ArrayList<>();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected LkGroupRoster() {}

    public LkGroupRoster(String groupName, List<String> studentIds) {
        this.groupName = groupName;
        this.studentIds = studentIds == null ? new ArrayList<>() : new ArrayList<>(studentIds);
        this.updatedAt = Instant.now();
    }

    public String getGroupName() {
        return groupName;
    }

    public List<String> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<String> studentIds) {
        this.studentIds = studentIds == null ? new ArrayList<>() : new ArrayList<>(studentIds);
        this.updatedAt = Instant.now();
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }
}
