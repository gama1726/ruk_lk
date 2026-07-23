package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_schedule_context")
public class StudentScheduleContext {

    @Id
    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false, length = 255)
    private String groupName;

    @Column(nullable = false, length = 64)
    private String groupGuid;

    @Column(nullable = false, length = 64)
    private String branchGuid;

    @Column(nullable = false)
    private Instant updatedAt;

    protected StudentScheduleContext() {}

    public StudentScheduleContext(
        String studentId,
        String groupName,
        String groupGuid,
        String branchGuid,
        Instant updatedAt
    ) {
        this.studentId = studentId;
        this.groupName = groupName;
        this.groupGuid = groupGuid;
        this.branchGuid = branchGuid;
        this.updatedAt = updatedAt;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getGroupName() {
        return groupName;
    }

    public String getGroupGuid() {
        return groupGuid;
    }

    public String getBranchGuid() {
        return branchGuid;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(String groupName, String groupGuid, String branchGuid, Instant updatedAt) {
        this.groupName = groupName;
        this.groupGuid = groupGuid;
        this.branchGuid = branchGuid;
        this.updatedAt = updatedAt;
    }

    public ScheduleSessionContext toSessionContext() {
        return new ScheduleSessionContext(groupName, groupGuid, branchGuid);
    }
}
