package ru.ruc.lk.ruk_lk_api.passphoto;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoAdminItemDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoIssueDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoRejectRequest;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoSubmissionDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoValidationResultDto;

@RestController
@RequestMapping("/api/student/pass-photo")
public class PassPhotoController {

    private final PassPhotoService passPhotoService;

    public PassPhotoController(PassPhotoService passPhotoService) {
        this.passPhotoService = passPhotoService;
    }

    @GetMapping
    public PassPhotoSubmissionDto current(HttpSession session) {
        return passPhotoService.getCurrent(session);
    }

    @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PassPhotoValidationResultDto validate(
        HttpSession session,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        return passPhotoService.validatePreview(session, file);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PassPhotoSubmissionDto upload(
        HttpSession session,
        @RequestParam("file") MultipartFile file
    ) throws IOException {
        return passPhotoService.submit(session, file);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(HttpSession session, @PathVariable UUID id) throws IOException {
        byte[] bytes = passPhotoService.readImageForStudent(session, id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=60")
            .body(bytes);
    }
}

@RestController
@RequestMapping("/api/admin/pass-photos")
class PassPhotoAdminController {

    private final PassPhotoService passPhotoService;
    private final AdminTokenVerifier adminTokenVerifier;

    PassPhotoAdminController(PassPhotoService passPhotoService, AdminTokenVerifier adminTokenVerifier) {
        this.passPhotoService = passPhotoService;
        this.adminTokenVerifier = adminTokenVerifier;
    }

    @GetMapping
    public List<PassPhotoAdminItemDto> pending(@RequestHeader("X-Admin-Token") String token) {
        adminTokenVerifier.verify(token);
        return passPhotoService.listPending();
    }

    @GetMapping("/history")
    public List<PassPhotoAdminItemDto> history(
        @RequestHeader("X-Admin-Token") String token,
        @RequestParam(defaultValue = "30") int limit
    ) {
        adminTokenVerifier.verify(token);
        return passPhotoService.listProcessed(limit);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(
        @RequestHeader("X-Admin-Token") String token,
        @PathVariable UUID id
    ) throws IOException {
        adminTokenVerifier.verify(token);
        byte[] bytes = passPhotoService.readImageForAdmin(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
            .body(bytes);
    }

    @PostMapping("/{id}/approve")
    public PassPhotoSubmissionDto approve(
        @RequestHeader("X-Admin-Token") String token,
        @PathVariable UUID id
    ) throws IOException {
        adminTokenVerifier.verify(token);
        return passPhotoService.approve(id, "admin");
    }

    @PostMapping("/{id}/reject")
    public PassPhotoSubmissionDto reject(
        @RequestHeader("X-Admin-Token") String token,
        @PathVariable UUID id,
        @RequestBody PassPhotoRejectRequest body
    ) {
        adminTokenVerifier.verify(token);
        return passPhotoService.reject(id, "admin", body.reason());
    }

    @PostMapping("/{id}/retry-perco")
    public PassPhotoSubmissionDto retryPerco(
        @RequestHeader("X-Admin-Token") String token,
        @PathVariable UUID id
    ) throws IOException {
        adminTokenVerifier.verify(token);
        return passPhotoService.retryPerco(id, "admin");
    }

    @PostMapping("/{id}/revert")
    public Map<String, String> revert(
        @RequestHeader("X-Admin-Token") String token,
        @PathVariable UUID id
    ) throws IOException {
        adminTokenVerifier.verify(token);
        passPhotoService.revert(id);
        return Map.of("ok", "true");
    }
}
