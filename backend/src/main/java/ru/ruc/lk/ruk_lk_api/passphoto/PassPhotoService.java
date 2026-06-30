package ru.ruc.lk.ruk_lk_api.passphoto;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoClient;
import ru.ruc.lk.ruk_lk_api.integration.perco.PercoException;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoAdminItemDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoSubmissionDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoValidationResultDto;

@Service
public class PassPhotoService {

    private static final String SESSION_KEY = "STUDENT";

    private final PassPhotoSubmissionRepository repository;
    private final PassPhotoValidationService validationService;
    private final PassPhotoStorageService storageService;
    private final PercoClient percoClient;
    private final OneCClient oneCClient;

    public PassPhotoService(
        PassPhotoSubmissionRepository repository,
        PassPhotoValidationService validationService,
        PassPhotoStorageService storageService,
        PercoClient percoClient,
        OneCClient oneCClient
    ) {
        this.repository = repository;
        this.validationService = validationService;
        this.storageService = storageService;
        this.percoClient = percoClient;
        this.oneCClient = oneCClient;
    }

    public PassPhotoSubmissionDto getCurrent(HttpSession session) {
        StudentSession student = requireStudent(session);
        return repository.findFirstByStudentIdOrderBySubmittedAtDesc(student.studentId())
            .map(PassPhotoMapper::toDto)
            .orElse(emptyDto());
    }

    public PassPhotoValidationResultDto validatePreview(HttpSession session, MultipartFile file) throws IOException {
        requireStudent(session);
        byte[] bytes = file.getBytes();
        PassPhotoValidationResult result = validationService.validate(bytes, file.getContentType());
        return PassPhotoMapper.toValidationDto(result);
    }

    public PassPhotoSubmissionDto submit(HttpSession session, MultipartFile file) throws IOException {
        StudentSession student = requireStudent(session);

        if (repository.findFirstByStudentIdAndStatus(student.studentId(), PassPhotoStatus.PENDING).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Фото уже на проверке. Дождитесь решения сотрудника.");
        }

        byte[] bytes = file.getBytes();
        PassPhotoValidationResult result = validationService.validate(bytes, file.getContentType());
        if (result.hasFailures()) {
            throw new PassPhotoValidationException(result.issues());
        }

        byte[] storedBytes = validationService.normalizeForStorage(bytes, file.getContentType());
        if (storedBytes.length > validationService.maxSizeBytes()) {
            throw new PassPhotoValidationException(List.of(new PassPhotoIssue(
                PassPhotoIssueCode.FILE_TOO_LARGE,
                PassPhotoIssueSeverity.FAIL,
                "Файл слишком большой. Максимум 2 МБ."
            )));
        }

        String zachetka = resolveZachetka(student.studentId());
        UUID id = UUID.randomUUID();
        String stored = storageService.save(id, storedBytes);

        List<PassPhotoIssue> warnings = result.issues().stream()
            .filter(i -> i.severity() == PassPhotoIssueSeverity.WARN)
            .toList();

        PassPhotoSubmission submission = new PassPhotoSubmission(
            id,
            student.studentId(),
            student.fullName(),
            zachetka,
            stored,
            PassPhotoStatus.PENDING,
            PassPhotoMapper.warningsToJson(warnings)
        );
        repository.save(submission);
        return PassPhotoMapper.toDto(submission);
    }

    public byte[] readImageForStudent(HttpSession session, UUID id) throws IOException {
        StudentSession student = requireStudent(session);
        PassPhotoSubmission submission = requireSubmission(id);
        if (!submission.getStudentId().equals(student.studentId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к этому фото");
        }
        return storageService.read(submission.getStoredFileName());
    }

    public byte[] readImageForAdmin(UUID id) throws IOException {
        PassPhotoSubmission submission = requireSubmission(id);
        return storageService.read(submission.getStoredFileName());
    }

    private static final List<PassPhotoStatus> REVERTABLE_STATUSES = List.of(
        PassPhotoStatus.REJECTED,
        PassPhotoStatus.PERCO_SYNCED,
        PassPhotoStatus.PERCO_FAILED
    );

    public List<PassPhotoAdminItemDto> listPending() {
        return repository.findByStatusOrderBySubmittedAtAsc(PassPhotoStatus.PENDING).stream()
            .map(PassPhotoMapper::toAdminItem)
            .toList();
    }

    public List<PassPhotoAdminItemDto> listProcessed(int limit) {
        int capped = Math.min(Math.max(limit, 1), 100);
        return repository.findByStatusInOrderByReviewedAtDesc(
            REVERTABLE_STATUSES,
            PageRequest.of(0, capped)
        ).stream()
            .map(PassPhotoMapper::toAdminItem)
            .toList();
    }

    public PassPhotoSubmissionDto approve(UUID id, String reviewer) throws IOException {
        PassPhotoSubmission submission = requireSubmission(id);
        if (submission.getStatus() != PassPhotoStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Заявка уже обработана");
        }

        submission.setStatus(PassPhotoStatus.PERCO_SYNCING);
        repository.save(submission);

        byte[] jpeg = storageService.read(submission.getStoredFileName());
        String zachetka = submission.getZachetka();
        if (zachetka == null || zachetka.isBlank()) {
            zachetka = submission.getStudentId();
        }

        try {
            percoClient.uploadPassPhoto(zachetka, jpeg);
            submission.setStatus(PassPhotoStatus.PERCO_SYNCED);
            submission.setPercoSyncedAt(Instant.now());
            submission.setPercoError(null);
        } catch (PercoException e) {
            submission.setStatus(PassPhotoStatus.PERCO_FAILED);
            submission.setPercoError(e.getMessage());
        }

        submission.setReviewedAt(Instant.now());
        submission.setReviewedBy(reviewer);
        repository.save(submission);
        return PassPhotoMapper.toDto(submission);
    }

    public PassPhotoSubmissionDto reject(UUID id, String reviewer, String reason) {
        PassPhotoSubmission submission = requireSubmission(id);
        if (submission.getStatus() != PassPhotoStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Заявка уже обработана");
        }
        submission.setStatus(PassPhotoStatus.REJECTED);
        submission.setRejectReason(reason == null || reason.isBlank() ? "Фото не подходит" : reason.trim());
        submission.setReviewedAt(Instant.now());
        submission.setReviewedBy(reviewer);
        repository.save(submission);
        return PassPhotoMapper.toDto(submission);
    }

    /**
     * Удаляет обработанную заявку и файл — студент сможет загрузить фото заново.
     */
    public void revert(UUID id) throws IOException {
        PassPhotoSubmission submission = requireSubmission(id);
        if (submission.getStatus() == PassPhotoStatus.PENDING
            || submission.getStatus() == PassPhotoStatus.PERCO_SYNCING) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Откат недоступен для заявки на проверке. Используйте «Отклонить»."
            );
        }
        if (!REVERTABLE_STATUSES.contains(submission.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Заявку нельзя откатить");
        }

        String fileName = submission.getStoredFileName();
        repository.delete(submission);
        if (fileName != null && !fileName.isBlank()) {
            storageService.delete(fileName);
        }
    }

    public PassPhotoSubmissionDto retryPerco(UUID id, String reviewer) throws IOException {
        PassPhotoSubmission submission = requireSubmission(id);
        if (submission.getStatus() != PassPhotoStatus.PERCO_FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Повтор доступен только после ошибки Perco");
        }
        submission.setStatus(PassPhotoStatus.PERCO_SYNCING);
        repository.save(submission);

        byte[] jpeg = storageService.read(submission.getStoredFileName());
        String zachetka = submission.getZachetka() != null ? submission.getZachetka() : submission.getStudentId();
        try {
            percoClient.uploadPassPhoto(zachetka, jpeg);
            submission.setStatus(PassPhotoStatus.PERCO_SYNCED);
            submission.setPercoSyncedAt(Instant.now());
            submission.setPercoError(null);
        } catch (PercoException e) {
            submission.setStatus(PassPhotoStatus.PERCO_FAILED);
            submission.setPercoError(e.getMessage());
        }
        submission.setReviewedBy(reviewer);
        submission.setReviewedAt(Instant.now());
        repository.save(submission);
        return PassPhotoMapper.toDto(submission);
    }

    private String resolveZachetka(String studentId) {
        return oneCClient.fetchProfile(studentId)
            .map(p -> p.zachetka() != null && !p.zachetka().isBlank() ? p.zachetka().trim() : p.studentId())
            .orElse(studentId);
    }

    private PassPhotoSubmission requireSubmission(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));
    }

    private static PassPhotoSubmissionDto emptyDto() {
        return new PassPhotoSubmissionDto(null, null, null, List.of(), null, null, null, null, false);
    }

    private static StudentSession requireStudent(HttpSession session) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала войдите в систему");
        }
        return student;
    }
}
