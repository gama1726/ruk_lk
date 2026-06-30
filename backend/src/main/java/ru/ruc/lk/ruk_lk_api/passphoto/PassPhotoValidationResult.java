package ru.ruc.lk.ruk_lk_api.passphoto;

import java.util.List;

public record PassPhotoValidationResult(List<PassPhotoIssue> issues) {

    public boolean hasFailures() {
        return issues.stream().anyMatch(i -> i.severity() == PassPhotoIssueSeverity.FAIL);
    }

    public boolean hasWarnings() {
        return issues.stream().anyMatch(i -> i.severity() == PassPhotoIssueSeverity.WARN);
    }
}
