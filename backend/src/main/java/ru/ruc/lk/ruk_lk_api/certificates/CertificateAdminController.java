package ru.ruc.lk.ruk_lk_api.certificates;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateApproveRequest;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRejectRequest;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsUpdateRequest;

@RestController
@RequestMapping("/api/admin/lk/certificates")
public class CertificateAdminController {

    private final CertificateAdminService settingsService;
    private final CertificateService certificateService;

    public CertificateAdminController(
        CertificateAdminService settingsService,
        CertificateService certificateService
    ) {
        this.settingsService = settingsService;
        this.certificateService = certificateService;
    }

    @GetMapping("/{campus}")
    public List<CertificateRequestSummaryDto> list(@PathVariable String campus, HttpSession session) {
        return settingsService.list(session, campus);
    }

    @GetMapping("/{campus}/settings")
    public CertificateSettingsDto settings(@PathVariable String campus, HttpSession session) {
        return settingsService.getSettings(session, campus);
    }

    @PutMapping("/{campus}/settings")
    public CertificateSettingsDto updateSettings(
        @PathVariable String campus,
        @RequestBody CertificateSettingsUpdateRequest body,
        HttpSession session
    ) {
        return settingsService.updateSettings(session, campus, body);
    }

    @GetMapping("/{campus}/requests/{id}")
    public CertificateRequestDto get(
        @PathVariable String campus,
        @PathVariable UUID id,
        HttpSession session
    ) {
        CertificateRequestDto dto = certificateService.getAdmin(session, id);
        assertCampus(campus, dto.campus());
        return dto;
    }

    @PostMapping("/{campus}/requests/{id}/approve")
    public CertificateRequestDto approve(
        @PathVariable String campus,
        @PathVariable UUID id,
        @RequestBody CertificateApproveRequest body,
        HttpSession session
    ) {
        CertificateRequestDto before = certificateService.getAdmin(session, id);
        assertCampus(campus, before.campus());
        return certificateService.approve(session, id, body);
    }

    @PostMapping("/{campus}/requests/{id}/reject")
    public CertificateRequestDto reject(
        @PathVariable String campus,
        @PathVariable UUID id,
        @RequestBody CertificateRejectRequest body,
        HttpSession session
    ) {
        CertificateRequestDto before = certificateService.getAdmin(session, id);
        assertCampus(campus, before.campus());
        return certificateService.reject(session, id, body);
    }

    @GetMapping("/{campus}/requests/{id}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> download(
        @PathVariable String campus,
        @PathVariable UUID id,
        @PathVariable UUID attachmentId,
        HttpSession session
    ) throws IOException {
        CertificateRequestDto meta = certificateService.getAdmin(session, id);
        assertCampus(campus, meta.campus());
        byte[] bytes = certificateService.readAttachmentAdmin(session, id, attachmentId);
        String filename = meta.attachments().stream()
            .filter(a -> a.id().equals(attachmentId.toString()))
            .map(a -> a.originalFilename())
            .findFirst()
            .orElse("attachment");
        String contentType = meta.attachments().stream()
            .filter(a -> a.id().equals(attachmentId.toString()))
            .map(a -> a.contentType())
            .findFirst()
            .orElse(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .body(bytes);
    }

    private static void assertCampus(String pathCampus, String dtoCampus) {
        String expected = LkAbsenceReportCampusAlias.normalize(pathCampus);
        String actual = LkAbsenceReportCampusAlias.normalize(dtoCampus);
        if (!expected.equals(actual)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Заявка не найдена в этом разделе"
            );
        }
    }

    /** Нормализация сегмента кампуса для сравнения path vs dto. */
    private static final class LkAbsenceReportCampusAlias {
        private LkAbsenceReportCampusAlias() {}

        static String normalize(String raw) {
            return raw == null ? "" : raw.trim().toLowerCase(java.util.Locale.ROOT);
        }
    }
}
