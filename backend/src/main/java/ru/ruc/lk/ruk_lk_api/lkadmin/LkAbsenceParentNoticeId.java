package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class LkAbsenceParentNoticeId implements Serializable {

    private LocalDate reportDate;
    private String studentId;

    public LkAbsenceParentNoticeId() {}

    public LkAbsenceParentNoticeId(LocalDate reportDate, String studentId) {
        this.reportDate = reportDate;
        this.studentId = studentId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof LkAbsenceParentNoticeId that)) {
            return false;
        }
        return Objects.equals(reportDate, that.reportDate)
            && Objects.equals(studentId, that.studentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(reportDate, studentId);
    }
}
