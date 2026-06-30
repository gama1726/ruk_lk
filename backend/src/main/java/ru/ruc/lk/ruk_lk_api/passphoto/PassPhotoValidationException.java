package ru.ruc.lk.ruk_lk_api.passphoto;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class PassPhotoValidationException extends RuntimeException {

    private final List<PassPhotoIssue> issues;

    public PassPhotoValidationException(List<PassPhotoIssue> issues) {
        super("Фото не прошло проверку");
        this.issues = issues;
    }

    public List<PassPhotoIssue> getIssues() {
        return issues;
    }
}
