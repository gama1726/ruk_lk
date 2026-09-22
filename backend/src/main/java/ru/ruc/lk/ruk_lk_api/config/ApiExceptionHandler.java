package ru.ruc.lk.ruk_lk_api.config;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoValidationException;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoIssueDto;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final String UPLOAD_TOO_LARGE =
        "Файл слишком большой. Одно фото — до 50 МБ, фото и студенческий билет вместе — до 105 МБ.";

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

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return ResponseEntity
            .status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("message", UPLOAD_TOO_LARGE));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, String>> handleMultipart(MultipartException ex) {
        if (ex instanceof MaxUploadSizeExceededException || hasMaxUploadCause(ex)) {
            return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", UPLOAD_TOO_LARGE));
        }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "message",
                "Не удалось принять файл. Проверьте формат и размер и попробуйте снова."
            ));
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

    private static boolean hasMaxUploadCause(Throwable ex) {
        Throwable cur = ex.getCause();
        while (cur != null) {
            if (cur instanceof MaxUploadSizeExceededException) {
                return true;
            }
            String name = cur.getClass().getName();
            if (name.contains("SizeLimitExceeded") || name.contains("MaxUploadSize")) {
                return true;
            }
            cur = cur.getCause();
        }
        return false;
    }
}
