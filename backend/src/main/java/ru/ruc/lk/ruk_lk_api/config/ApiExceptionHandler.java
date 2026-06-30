package ru.ruc.lk.ruk_lk_api.config;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoValidationException;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoIssueDto;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String message = ex.getReason();
        if (message == null || message.isBlank()) {
            message = ex.getStatusCode().toString();
        }
        return ResponseEntity
            .status(ex.getStatusCode())
            .body(Map.of("message", message));
    }

    @ExceptionHandler(PassPhotoValidationException.class)
    public ResponseEntity<Map<String, Object>> handlePassPhotoValidation(PassPhotoValidationException ex) {
        List<PassPhotoIssueDto> issues = ex.getIssues().stream()
            .map(i -> new PassPhotoIssueDto(i.code(), i.severity(), i.message()))
            .collect(Collectors.toList());
        return ResponseEntity.unprocessableEntity().body(Map.of(
            "message", ex.getMessage(),
            "issues", issues
        ));
    }
}
