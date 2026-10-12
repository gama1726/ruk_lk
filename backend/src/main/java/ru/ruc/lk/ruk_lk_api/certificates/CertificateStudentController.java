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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;

@RestController
@RequestMapping("/api/student/certificates")
public class CertificateStudentController {

    private final CertificateService service;

    public CertificateStudentController(CertificateService service) {
        this.service = service;
    }

    @GetMapping
    public List<CertificateRequestSummaryDto> list(HttpSession session) {
        return service.listMineStudent(session);
    }

    @GetMapping("/{id}")
    public CertificateRequestDto get(HttpSession session, @PathVariable UUID id) {
        return service.getMineStudent(session, id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CertificateRequestDto submit(
        HttpSession session,
        @RequestParam("type") String type,
        @RequestParam(value = "comment", required = false) String comment,
        @RequestParam("files") List<MultipartFile> files
    ) throws IOException {
        return service.submitStudent(session, type, comment, files);
    }

    @PostMapping("/{id}/cancel")
    public CertificateRequestDto cancel(HttpSession session, @PathVariable UUID id) {
        return service.cancelStudent(session, id);
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> download(
        HttpSession session,
        @PathVariable UUID id,
        @PathVariable UUID attachmentId
    ) throws IOException {
        CertificateRequestDto meta = service.getMineStudent(session, id);
        byte[] bytes = service.readAttachmentStudent(session, id, attachmentId);
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
}
