package ru.ruc.lk.ruk_lk_api.passphoto;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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
    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");
    private static final DateTimeFormatter RESUBMIT_FMT = DateTimeFormatter
        .ofPattern("d MMMM yyyy, HH:mm", Locale.forLanguageTag("ru"))
        .withZone(MOSCOW);

    private final PassPhotoSubmissionRepository repository;
    private final StudentPassPhotoPrefsRepository prefsRepository;
    private final PassPhotoValidationService validationService;
    private final PassPhotoValidationCache validationCache;
    private final PassPhotoStorageService storageService;
    private final PercoClient percoClient;
    private final OneCClient oneCClient;
    private final PassPhotoProperties properties;

    public PassPhotoService(
        PassPhotoSubmissionRepository repository,
        StudentPassPhotoPrefsRepository prefsRepository,
        PassPhotoValidationService validationService,
        PassPhotoValidationCache validationCache,
        PassPhotoStorageService storageService,
        PercoClient percoClient,
        OneCClient oneCClient,
        PassPhotoProperties properties
    ) {
        this.repository = repository;
        this.prefsRepository = prefsRepository;
        this.validationService = validationService;
        this.validationCache = validationCache;
        this.storageService = storageService;
        this.percoClient = percoClient;
        this.oneCClient = oneCClient;
        this.properties = properties;
    }

    public PassPhotoSubmissionDto getCurrent(HttpSession session) {
        StudentSession student = requireStudent(session);
        return repository.findFirstByStudentIdOrderBySubmittedAtDesc(student.studentId())
            .map(entity -> toStudentDto(entity, student.studentId()))
            .orElseGet(() -> emptyDto(isUseAsAvatar(student.studentId())));
    }

    public PassPhotoSubmissionDto setUseAsAvatar(HttpSession session, boolean useAsAvatar) {
        StudentSession student = requireStudent(session);
        StudentPassPhotoPrefs prefs = prefsRepository.findById(student.studentId())
            .orElseGet(() -> new StudentPassPhotoPrefs(student.studentId(), false));
        prefs.setUseAsAvatar(useAsAvatar);
        prefsRepository.save(prefs);
        return repository.findFirstByStudentIdOrderBySubmittedAtDesc(student.studentId())
            .map(entity -> toStudentDto(entity, student.studentId()))
            .orElseGet(() -> emptyDto(useAsAvatar));
    }

    public PassPhotoValidationResultDto validatePreview(HttpSession session, MultipartFile file) throws IOException {
        StudentSession student = requireStudent(session);
        byte[] bytes = file.getBytes();
        PassPhotoValidationResult result = validationService.validate(bytes, file.getContentType());
        validationCache.put(
            student.studentId(),
            sha256Hex(bytes),
            result,
            Duration.ofSeconds(Math.max(1, properties.validateCacheTtlSeconds()))
        );
        return PassPhotoMapper.toValidationDto(result);
    }

    public PassPhotoSubmissionDto submit(HttpSession session, MultipartFile file) throws IOException {
        StudentSession student = requireStudent(session);

        Optional<PassPhotoSubmission> latestOpt =
            repository.findFirstByStudentIdOrderBySubmittedAtDesc(student.studentId());
        if (latestOpt.isPresent()) {
            PassPhotoSubmission latest = latestOpt.get();
            if (latest.getStatus() == PassPhotoStatus.PENDING
                || latest.getStatus() == PassPhotoStatus.PERCO_SYNCING) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Фото уже на проверке. Дождитесь решения сотрудника."
                );
            }
            if (latest.getStatus() == PassPhotoStatus.PERCO_SYNCED) {
                Instant nextAt = nextResubmitAt(latest);
                if (nextAt != null && Instant.now().isBefore(nextAt)) {
                    throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Повторная загрузка фото доступна раз в "
                            + resubmitCooldownDays()
                            + " дн. Следующая попытка: "
                            + RESUBMIT_FMT.format(nextAt)
                    );
                }
            }
        }

        byte[] bytes = file.getBytes();
        String contentType = file.getContentType();
        String hash = sha256Hex(bytes);

        // После успешного /validate тот же файл в TTL не гоняет ML повторно.
        PassPhotoValidationResult result = validationCache.getIfMatch(student.studentId(), hash)
            .orElseGet(() -> validationService.validate(bytes, contentType));
        if (result.hasFailures()) {
            throw new PassPhotoValidationException(result.issues());
        }

        byte[] storedBytes = validationService.normalizeForStorage(bytes, contentType);
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
        validationCache.invalidate(student.studentId());
        return toStudentDto(submission);
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

    private static final List<PassPhotoStatus> QUEUE_STATUSES = List.of(
        PassPhotoStatus.PENDING,
        PassPhotoStatus.PERCO_SYNCING
    );

    private static final List<PassPhotoStatus> REVERTABLE_STATUSES = List.of(
        PassPhotoStatus.REJECTED,
        PassPhotoStatus.PERCO_FAILED
    );

    private static final List<PassPhotoStatus> HISTORY_STATUSES = List.of(
        PassPhotoStatus.REJECTED,
        PassPhotoStatus.PERCO_SYNCED,
        PassPhotoStatus.PERCO_FAILED
    );

    public List<PassPhotoAdminItemDto> listPending() {
        return repository.findByStatusInOrderBySubmittedAtAsc(QUEUE_STATUSES).stream()
            .map(PassPhotoMapper::toAdminItem)
            .toList();
    }

    /**
     * Зависшие PERCO_SYNCING после падения/рестарта API → PERCO_FAILED,
     * чтобы снова были видны в истории и доступны для retry.
     */
    public int recoverStuckSyncing() {
        List<PassPhotoSubmission> stuck = repository.findByStatus(PassPhotoStatus.PERCO_SYNCING);
        if (stuck.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        int recovered = 0;
        for (PassPhotoSubmission submission : stuck) {
            submission.setStatus(PassPhotoStatus.PERCO_FAILED);
            submission.setPercoError("Синхронизация с Perco прервана. Повторите загрузку из админки.");
            if (submission.getReviewedAt() == null) {
                submission.setReviewedAt(now);
            }
            if (submission.getReviewedBy() == null || submission.getReviewedBy().isBlank()) {
                submission.setReviewedBy("system");
            }
            repository.save(submission);
            recovered++;
        }
        return recovered;
    }

    public List<PassPhotoAdminItemDto> listProcessed(int limit) {
        int capped = Math.min(Math.max(limit, 1), 100);
        return repository.findByStatusInOrderByReviewedAtDesc(
            HISTORY_STATUSES,
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
        return toStudentDto(submission);
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
        return toStudentDto(submission);
    }

    /**
     * Удаляет заявку и файл в ЛК (только REJECTED / PERCO_FAILED).
     * Для принятых (PERCO_SYNCED) откат недоступен — фото уже в Perco;
     * студент может загрузить новое по cooldown.
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
        if (submission.getStatus() == PassPhotoStatus.PERCO_SYNCED) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Принятое фото нельзя откатить: оно уже в системе пропуска. "
                    + "Студент сможет загрузить новое по истечении лимита повторной отправки."
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
        return toStudentDto(submission, submission.getStudentId());
    }

    private PassPhotoSubmissionDto toStudentDto(PassPhotoSubmission entity) {
        return toStudentDto(entity, entity.getStudentId());
    }

    private PassPhotoSubmissionDto toStudentDto(PassPhotoSubmission entity, String studentId) {
        ResubmitPolicy policy = resubmitPolicy(entity);
        return PassPhotoMapper.toDto(
            entity,
            policy.canResubmit(),
            policy.nextResubmitAt(),
            isUseAsAvatar(studentId)
        );
    }

    private boolean isUseAsAvatar(String studentId) {
        return prefsRepository.findById(studentId)
            .map(StudentPassPhotoPrefs::isUseAsAvatar)
            .orElse(false);
    }

    private ResubmitPolicy resubmitPolicy(PassPhotoSubmission entity) {
        PassPhotoStatus status = entity.getStatus();
        if (status == PassPhotoStatus.PENDING || status == PassPhotoStatus.PERCO_SYNCING) {
            return new ResubmitPolicy(false, null);
        }
        if (status == PassPhotoStatus.REJECTED || status == PassPhotoStatus.PERCO_FAILED) {
            return new ResubmitPolicy(true, null);
        }
        if (status == PassPhotoStatus.PERCO_SYNCED) {
            Instant nextAt = nextResubmitAt(entity);
            if (nextAt == null || !Instant.now().isBefore(nextAt)) {
                return new ResubmitPolicy(true, null);
            }
            return new ResubmitPolicy(false, nextAt);
        }
        return new ResubmitPolicy(false, null);
    }

    private Instant nextResubmitAt(PassPhotoSubmission synced) {
        Instant anchor = synced.getPercoSyncedAt() != null
            ? synced.getPercoSyncedAt()
            : synced.getSubmittedAt();
        if (anchor == null) {
            return null;
        }
        return anchor.plus(Duration.ofDays(resubmitCooldownDays()));
    }

    private int resubmitCooldownDays() {
        int days = properties.resubmitCooldownDays();
        return days > 0 ? days : 3;
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

    private static PassPhotoSubmissionDto emptyDto(boolean useAsAvatar) {
        return new PassPhotoSubmissionDto(
            null, null, null, List.of(), null, null, null, null, false, true, null, useAsAvatar
        );
    }

    private static StudentSession requireStudent(HttpSession session) {
        Object raw = session.getAttribute(SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала войдите в систему");
        }
        return student;
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private record ResubmitPolicy(boolean canResubmit, Instant nextResubmitAt) {}
}
