package ru.ruc.lk.ruk_lk_api.passphoto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student_pass_photo_prefs")
public class StudentPassPhotoPrefs {

    @Id
    @Column(nullable = false, length = 64)
    private String studentId;

    @Column(nullable = false)
    private boolean useAsAvatar;

    protected StudentPassPhotoPrefs() {}

    public StudentPassPhotoPrefs(String studentId, boolean useAsAvatar) {
        this.studentId = studentId;
        this.useAsAvatar = useAsAvatar;
    }

    public String getStudentId() {
        return studentId;
    }

    public boolean isUseAsAvatar() {
        return useAsAvatar;
    }

    public void setUseAsAvatar(boolean useAsAvatar) {
        this.useAsAvatar = useAsAvatar;
    }
}
