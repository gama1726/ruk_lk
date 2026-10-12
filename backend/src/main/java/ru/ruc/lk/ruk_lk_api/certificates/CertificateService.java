package ru.ruc.lk.ruk_lk_api.certificates;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentAuthService;
import ru.ruc.lk.ruk_lk_api.api.auth.ParentSession;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import ru.ruc.lk.ruk_lk_api.api.features.PreviewStudents;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateApproveRequest;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateAttachmentDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRejectRequest;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxBindingService;
import ru.ruc.lk.ruk_lk_api.integration.max.VerificationMaxSender;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminAuthService;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminSession;
import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoValidationService;

@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);
    private static final String STUDENT_SESSION_KEY = "STUDENT";

    private final CertificateProperties properties;
    private final CertificateRequestRepository requestRepository;
    private final CertificateSettingsRepository settingsRepository;
    private final CertificateStorageService storageService;
    private final CertificateCampusResolver campusResolver;
    private final PassPhotoValidationService imageNormalizer;
    private final PreviewStudents previewStudents;
    private final CertificateNotificationMailer mailer;
    private final CertificateAuditRepository auditRepository;
    private final MaxBindingService maxBindingService;
    private final ObjectProvider<VerificationMaxSender> maxSender;
    private final OneCClient oneCClient;

    public CertificateService(
        CertificateProperties properties,
        CertificateRequestRepository requestRepository,
        CertificateSettingsRepository settingsRepository,
        CertificateStorageService storageService,
        CertificateCampusResolver campusResolver,
        PassPhotoValidationService imageNormalizer,
        PreviewStudents previewStudents,
        CertificateNotificationMailer mailer,
        CertificateAuditRepository auditRepository,
        MaxBindingService maxBindingService,
        ObjectProvider<VerificationMaxSender> maxSender,
        OneCClient oneCClient
    ) {
        this.properties = properties;
        this.requestRepository = requestRepository;
        this.settingsRepository = settingsRepository;
        this.storageService = storageService;
        this.campusResolver = campusResolver;
        this.imageNormalizer = imageNormalizer;
        this.previewStudents = previewStudents;
        this.mailer = mailer;
        this.auditRepository = auditRepository;
        this.maxBindingService = maxBindingService;
        this.maxSender = maxSender;
        this.oneCClient = oneCClient;
    }

    @Transactional(readOnly = true)
    public List<CertificateRequestSummaryDto> listMineStudent(HttpSession session) {
        StudentSession student = requirePreviewStudent(session);
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(student.studentId()).stream()
            .map(CertificateAdminService::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CertificateRequestSummaryDto> listMineParent(HttpSession session) {
        ParentSession parent = requirePreviewParent(session);
        return requestRepository.findByStudentIdOrderByCreatedAtDesc(parent.studentId()).stream()
            .map(CertificateAdminService::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public CertificateRequestDto getMineStudent(HttpSession session, UUID id) {
        StudentSession student = requirePreviewStudent(session);
        return toDto(requireOwned(id, student.studentId()));
    }

    @Transactional(readOnly = true)
    public CertificateRequestDto getMineParent(HttpSession session, UUID id) {
        ParentSession parent = requirePreviewParent(session);
        return toDto(requireOwned(id, parent.studentId()));
    }

    @Transactional
    public CertificateRequestDto submitStudent(
        HttpSession session,
        String typeRaw,
        String comment,
        List<MultipartFile> files
    ) throws IOException {
        StudentSession student = requirePreviewStudent(session);
        return submit(
            student.studentId(),
            student.fullName(),
            CertificateSubmittedBy.STUDENT,
            student.fullName(),
            student.email(),
            student.studentId(),
            "STUDENT",
            student.studentId(),
            student.fullName(),
            typeRaw,
            comment,
            files
        );
    }

    @Transactional
    public CertificateRequestDto submitParent(
        HttpSession session,
        String typeRaw,
        String comment,
        List<MultipartFile> files
    ) throws IOException {
        ParentSession parent = requirePreviewParent(session);
        return submit(
            parent.studentId(),
            parent.studentFullName(),
            CertificateSubmittedBy.PARENT,
            parent.parentFullName(),
            parent.parentEmail(),
            MaxBindingService.parentBindingKey(parent.studentId(), parent.memberIndex()),
            "PARENT",
            parent.studentId() + "#" + parent.memberIndex(),
            parent.parentFullName(),
            typeRaw,
            comment,
            files
        );
    }

    @Transactional
    public CertificateRequestDto cancelStudent(HttpSession session, UUID id) {
        StudentSession student = requirePreviewStudent(session);
        CertificateRequestEntity row = requireOwned(id, student.studentId());
        CertificateRequestDto dto = cancel(row);
        audit(row.getId(), null, CertificateAuditAction.CANCEL, "STUDENT", student.studentId(), student.fullName(), null);
        return dto;
    }

    @Transactional
    public CertificateRequestDto cancelParent(HttpSession session, UUID id) {
        ParentSession parent = requirePreviewParent(session);
        CertificateRequestEntity row = requireOwned(id, parent.studentId());
        CertificateRequestDto dto = cancel(row);
        audit(
            row.getId(),
            null,
            CertificateAuditAction.CANCEL,
            "PARENT",
            parent.studentId() + "#" + parent.memberIndex(),
            parent.parentFullName(),
            null
        );
        return dto;
    }

    @Transactional(readOnly = true)
    public CertificateRequestDto getAdmin(HttpSession session, UUID id) {
        CertificateRequestEntity row = requireRequest(id);
        LkAdminAuthService.requireCertificateCampus(session, row.getCampus());
        return toDto(row);
    }

    @Transactional
    public CertificateRequestDto approve(HttpSession session, UUID id, CertificateApproveRequest body) {
        CertificateRequestEntity row = requireRequest(id);
        LkAdminAuthService.requireCertificateCampus(session, row.getCampus());
        if (row.getStatus() != CertificateStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Заявка уже обработана");
        }
        if (body == null || body.from() == null || body.to() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите период отсутствия (с и по)");
        }
        if (body.to().isBefore(body.from())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Дата окончания раньше начала");
        }
        LkAdminSession admin = LkAdminAuthService.require(session);
        row.approve(body.from(), body.to(), admin.username());
        requestRepository.save(row);
        audit(
            row.getId(),
            null,
            CertificateAuditAction.APPROVE,
            "ADMIN",
            admin.username(),
            admin.fullName(),
            body.from() + ".." + body.to()
        );
        notifySubmitterApproved(row);
        return toDto(row);
    }

    @Transactional
    public CertificateRequestDto reject(HttpSession session, UUID id, CertificateRejectRequest body) {
        CertificateRequestEntity row = requireRequest(id);
        LkAdminAuthService.requireCertificateCampus(session, row.getCampus());
        if (row.getStatus() != CertificateStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Заявка уже обработана");
        }
        String reason = body == null ? null : body.reason();
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите причину отклонения");
        }
        LkAdminSession admin = LkAdminAuthService.require(session);
        row.reject(reason.trim(), admin.username());
        requestRepository.save(row);
        audit(
            row.getId(),
            null,
            CertificateAuditAction.REJECT,
            "ADMIN",
            admin.username(),
            admin.fullName(),
            reason.trim()
        );
        notifySubmitterRejected(row);
        return toDto(row);
    }

    @Transactional
    public byte[] readAttachmentStudent(HttpSession session, UUID requestId, UUID attachmentId) throws IOException {
        StudentSession student = requirePreviewStudent(session);
        CertificateRequestEntity row = requireOwned(requestId, student.studentId());
        byte[] bytes = readOwnedAttachment(row, attachmentId);
        audit(
            row.getId(),
            attachmentId,
            CertificateAuditAction.DOWNLOAD,
            "STUDENT",
            student.studentId(),
            student.fullName(),
            null
        );
        return bytes;
    }

    @Transactional
    public byte[] readAttachmentParent(HttpSession session, UUID requestId, UUID attachmentId) throws IOException {
        ParentSession parent = requirePreviewParent(session);
        CertificateRequestEntity row = requireOwned(requestId, parent.studentId());
        byte[] bytes = readOwnedAttachment(row, attachmentId);
        audit(
            row.getId(),
            attachmentId,
            CertificateAuditAction.DOWNLOAD,
            "PARENT",
            parent.studentId() + "#" + parent.memberIndex(),
            parent.parentFullName(),
            null
        );
        return bytes;
    }

    @Transactional
    public byte[] readAttachmentAdmin(HttpSession session, UUID requestId, UUID attachmentId) throws IOException {
        CertificateRequestEntity row = requireRequest(requestId);
        LkAdminAuthService.requireCertificateCampus(session, row.getCampus());
        LkAdminSession admin = LkAdminAuthService.require(session);
        byte[] bytes = readOwnedAttachment(row, attachmentId);
        audit(
            row.getId(),
            attachmentId,
            CertificateAuditAction.DOWNLOAD,
            "ADMIN",
            admin.username(),
            admin.fullName(),
            null
        );
        return bytes;
    }

    @Transactional(readOnly = true)
    public CertificateAttachmentEntity requireAttachmentMeta(CertificateRequestEntity row, UUID attachmentId) {
        return row.getAttachments().stream()
            .filter(a -> a.getId().equals(attachmentId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не найден"));
    }

    private CertificateRequestDto submit(
        String studentId,
        String studentFullName,
        CertificateSubmittedBy submittedBy,
        String submitterName,
        String submitterEmail,
        String submitterMaxBindKey,
        String actorType,
        String actorId,
        String actorName,
        String typeRaw,
        String comment,
        List<MultipartFile> files
    ) throws IOException {
        CertificateType type = CertificateType.fromRequest(typeRaw);
        LkAbsenceReportCampus campus = campusResolver.requireCampusForStudent(studentId);
        List<MultipartFile> uploads = files == null ? List.of() : files.stream()
            .filter(f -> f != null && !f.isEmpty())
            .toList();
        if (uploads.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Прикрепите хотя бы один файл");
        }
        if (uploads.size() > properties.maxAttachments()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Не больше " + properties.maxAttachments() + " файлов"
            );
        }

        UUID requestId = UUID.randomUUID();
        CertificateRequestEntity request = new CertificateRequestEntity(
            requestId,
            studentId,
            studentFullName,
            campus,
            type,
            submittedBy,
            submitterName,
            submitterEmail,
            submitterMaxBindKey,
            blankToNull(comment)
        );

        for (MultipartFile file : uploads) {
            if (file.getSize() > properties.maxSizeBytes()) {
                throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Файл больше 50 МБ: " + file.getOriginalFilename()
                );
            }
            byte[] raw = file.getBytes();
            String contentType = file.getContentType();
            String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            ProcessedFile processed = processUpload(raw, contentType, originalName);
            UUID attachmentId = UUID.randomUUID();
            String key = storageService.save(requestId, attachmentId, processed.extension(), processed.bytes());
            CertificateAttachmentEntity attachment = new CertificateAttachmentEntity(
                attachmentId,
                key,
                originalName,
                processed.contentType(),
                processed.bytes().length,
                processed.normalizedImage()
            );
            request.addAttachment(attachment);
        }

        requestRepository.save(request);
        audit(
            request.getId(),
            null,
            CertificateAuditAction.SUBMIT,
            actorType,
            actorId,
            actorName,
            type.name() + " x" + uploads.size()
        );
        notifyAdminNewRequest(request);
        return toDto(request);
    }

    private CertificateRequestDto cancel(CertificateRequestEntity row) {
        if (row.getStatus() != CertificateStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Отменить можно только заявку на проверке");
        }
        row.cancel();
        requestRepository.save(row);
        return toDto(row);
    }

    private ProcessedFile processUpload(byte[] raw, String contentType, String originalName) throws IOException {
        if (isPdf(raw, contentType, originalName)) {
            return new ProcessedFile(raw, "application/pdf", "pdf", false);
        }
        if (looksLikeHeic(raw, contentType, originalName)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "HEIC нужно конвертировать перед отправкой (как для фото пропуска)"
            );
        }
        try {
            byte[] jpeg = imageNormalizer.normalizeForStorage(raw, contentType);
            return new ProcessedFile(jpeg, "image/jpeg", "jpg", true);
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Поддерживаются PDF, JPG, PNG (HEIC — после конвертации на устройстве)"
            );
        }
    }

    private void notifyAdminNewRequest(CertificateRequestEntity request) {
        String email = settingsRepository.findById(request.getCampus())
            .map(CertificateSettingsEntity::getNotifyEmail)
            .orElse(null);
        if (email == null || email.isBlank()) {
            return;
        }
        String subject = "Новая справка · " + request.getCampus().campusLabel();
        String text = "Поступила заявка на проверку справки.\n"
            + "Студент: " + request.getStudentFullName() + " (" + request.getStudentId() + ")\n"
            + "Тип: " + request.getType().labelRu() + "\n"
            + "Отправитель: " + request.getSubmittedBy().name();
        String html = "<p>Поступила заявка на проверку справки.</p>"
            + "<p>Студент: <strong>" + escape(request.getStudentFullName()) + "</strong> ("
            + escape(request.getStudentId()) + ")</p>"
            + "<p>Тип: " + escape(request.getType().labelRu()) + "</p>";
        try {
            mailer.send(email, request.getCampus().campusLabel(), subject, html, text);
        } catch (RuntimeException e) {
            log.warn("Не удалось уведомить админа справок: {}", e.getMessage());
        }
    }

    private void notifySubmitterApproved(CertificateRequestEntity request) {
        String period = request.getApprovedFrom() + " — " + request.getApprovedTo();
        String text = "Ваша справка («" + request.getType().labelRu() + "») одобрена.\n"
            + "Период отсутствия: " + period;
        String html = "<p>Ваша справка («" + escape(request.getType().labelRu()) + "») одобрена.</p>"
            + "<p>Период отсутствия: <strong>" + escape(period) + "</strong></p>";
        notifySubmitter(request, "Справка одобрена", html, text);
    }

    private void notifySubmitterRejected(CertificateRequestEntity request) {
        String reason = request.getRejectionReason() == null ? "" : request.getRejectionReason();
        String text = "Ваша справка («" + request.getType().labelRu() + "») отклонена.\n"
            + "Причина: " + reason;
        String html = "<p>Ваша справка («" + escape(request.getType().labelRu()) + "») отклонена.</p>"
            + "<p>Причина: " + escape(reason) + "</p>";
        notifySubmitter(request, "Справка отклонена", html, text);
    }

    private void notifySubmitter(
        CertificateRequestEntity request,
        String subject,
        String html,
        String text
    ) {
        sendMaxIfBound(request.getSubmitterMaxBindKey(), text);
        String email = request.getSubmitterEmail();
        if (email == null || email.isBlank()) {
            return;
        }
        try {
            mailer.send(email, request.getSubmitterName(), subject, html, text);
        } catch (RuntimeException e) {
            log.warn("Не удалось отправить email заявителю: {}", e.getMessage());
        }
    }

    private void sendMaxIfBound(String bindKey, String text) {
        if (bindKey == null || bindKey.isBlank()) {
            return;
        }
        VerificationMaxSender sender = maxSender.getIfAvailable();
        if (sender == null || !sender.isConfigured()) {
            return;
        }
        Long maxUserId = maxBindingService.findMaxUserId(bindKey).orElse(null);
        if (maxUserId == null) {
            return;
        }
        try {
            sender.sendMessage(maxUserId, text);
        } catch (RuntimeException e) {
            log.warn("Не удалось отправить MAX заявителю: {}", e.getMessage());
        }
    }

    private void audit(
        UUID requestId,
        UUID attachmentId,
        CertificateAuditAction action,
        String actorType,
        String actorId,
        String actorName,
        String detail
    ) {
        try {
            auditRepository.save(new CertificateAuditEntity(
                requestId,
                attachmentId,
                action,
                actorType,
                actorId,
                actorName,
                detail
            ));
        } catch (RuntimeException e) {
            log.warn("Не удалось записать audit справок: {}", e.getMessage());
        }
    }

    private byte[] readOwnedAttachment(CertificateRequestEntity row, UUID attachmentId) throws IOException {
        CertificateAttachmentEntity attachment = requireAttachmentMeta(row, attachmentId);
        if (attachment.getPurgedAt() != null || attachment.getStorageKey() == null || attachment.getStorageKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Файл удалён по сроку хранения");
        }
        return storageService.read(attachment.getStorageKey());
    }

    private CertificateRequestEntity requireOwned(UUID id, String studentId) {
        CertificateRequestEntity row = requireRequest(id);
        if (!row.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена");
        }
        return row;
    }

    private CertificateRequestEntity requireRequest(UUID id) {
        return requestRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));
    }

    private StudentSession requirePreviewStudent(HttpSession session) {
        Object raw = session.getAttribute(STUDENT_SESSION_KEY);
        if (!(raw instanceof StudentSession student)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сначала войдите в систему");
        }
        requirePreview(student.studentId());
        return student;
    }

    private ParentSession requirePreviewParent(HttpSession session) {
        ParentSession parent = ParentAuthService.requireParent(session);
        requirePreview(parent.studentId());
        return parent;
    }

    private void requirePreview(String studentId) {
        if (!previewStudents.isPreviewStudent(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Раздел пока доступен тестовым учёткам");
        }
    }

    private CertificateRequestDto toDto(CertificateRequestEntity row) {
        List<CertificateAttachmentDto> attachments = new ArrayList<>();
        for (CertificateAttachmentEntity a : row.getAttachments()) {
            if (a.getPurgedAt() != null) {
                continue;
            }
            attachments.add(new CertificateAttachmentDto(
                a.getId().toString(),
                a.getOriginalFilename(),
                a.getContentType(),
                a.getSizeBytes()
            ));
        }
        OneCProfileResponse profile = null;
        try {
            profile = oneCClient.fetchProfile(row.getStudentId()).orElse(null);
        } catch (RuntimeException ignored) {
            // профиль необязателен для карточки
        }
        return new CertificateRequestDto(
            row.getId().toString(),
            row.getStudentId(),
            row.getStudentFullName(),
            row.getCampus().name().toLowerCase(Locale.ROOT),
            row.getType().name(),
            row.getType().labelRu(),
            row.getStatus().name(),
            row.getSubmittedBy().name(),
            row.getSubmitterName(),
            row.getComment(),
            row.getRejectionReason(),
            row.getApprovedFrom(),
            row.getApprovedTo(),
            row.getCreatedAt(),
            row.getReviewedAt(),
            row.getReviewedBy(),
            blankToNull(profile == null ? null : profile.group()),
            blankToNull(profile == null ? null : profile.faculty()),
            blankToNull(profile == null ? null : profile.course()),
            blankToNull(profile == null ? null : profile.department()),
            attachments
        );
    }

    private static boolean isPdf(byte[] bytes, String contentType, String name) {
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("pdf")) {
            return true;
        }
        if (name != null && name.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            return true;
        }
        return bytes != null && bytes.length >= 4
            && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    private static boolean looksLikeHeic(byte[] bytes, String contentType, String name) {
        if (name != null) {
            String lower = name.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
                return true;
            }
        }
        if (contentType != null) {
            String ct = contentType.toLowerCase(Locale.ROOT);
            if (ct.contains("heic") || ct.contains("heif")) {
                return true;
            }
        }
        if (bytes == null || bytes.length < 12) {
            return false;
        }
        if (bytes[4] != 'f' || bytes[5] != 't' || bytes[6] != 'y' || bytes[7] != 'p') {
            return false;
        }
        String brands = new String(bytes, 8, Math.min(bytes.length - 8, 20), java.nio.charset.StandardCharsets.US_ASCII)
            .toLowerCase(Locale.ROOT);
        return brands.contains("heic") || brands.contains("heif") || brands.contains("mif1") || brands.contains("msf1");
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    private record ProcessedFile(byte[] bytes, String contentType, String extension, boolean normalizedImage) {}
}
