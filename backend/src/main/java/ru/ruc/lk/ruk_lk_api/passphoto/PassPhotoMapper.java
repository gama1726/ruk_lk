package ru.ruc.lk.ruk_lk_api.passphoto;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoAdminItemDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoIssueDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoSubmissionDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoValidationResultDto;

final class PassPhotoMapper {

    private PassPhotoMapper() {}

    static PassPhotoSubmissionDto toDto(
        PassPhotoSubmission entity,
        boolean canResubmit,
        Instant nextResubmitAt
    ) {
        return new PassPhotoSubmissionDto(
            entity.getId().toString(),
            entity.getStatus(),
            entity.getRejectReason(),
            parseWarnings(entity.getValidationWarningsJson()),
            formatInstant(entity.getSubmittedAt()),
            formatInstant(entity.getReviewedAt()),
            formatInstant(entity.getPercoSyncedAt()),
            entity.getPercoError(),
            entity.getStoredFileName() != null && !entity.getStoredFileName().isBlank(),
            canResubmit,
            formatInstant(nextResubmitAt)
        );
    }

    static PassPhotoAdminItemDto toAdminItem(PassPhotoSubmission entity) {
        return new PassPhotoAdminItemDto(
            entity.getId().toString(),
            entity.getStudentId(),
            entity.getStudentFullName(),
            entity.getZachetka(),
            entity.getStatus(),
            entity.getValidationWarningsJson(),
            entity.getSubmittedAt(),
            entity.getReviewedAt(),
            entity.getRejectReason(),
            entity.getPercoError()
        );
    }

    static PassPhotoValidationResultDto toValidationDto(PassPhotoValidationResult result) {
        List<PassPhotoIssueDto> issues = result.issues().stream()
            .map(i -> new PassPhotoIssueDto(i.code(), i.severity(), i.message()))
            .toList();
        return new PassPhotoValidationResultDto(!result.hasFailures(), issues);
    }

    static String warningsToJson(List<PassPhotoIssue> warnings) {
        if (warnings == null || warnings.isEmpty()) {
            return null;
        }
        return warnings.stream()
            .map(PassPhotoIssue::message)
            .collect(Collectors.joining("\n"));
    }

    private static List<PassPhotoIssueDto> parseWarnings(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split("\n"))
            .filter(line -> !line.isBlank())
            .map(line -> new PassPhotoIssueDto(null, PassPhotoIssueSeverity.WARN, line.trim()))
            .toList();
    }

    private static String formatInstant(Instant instant) {
        return instant == null ? null : instant.toString();
    }
}
