package ru.ruc.lk.ruk_lk_api.passphoto;

import java.io.IOException;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.admin.AdminAuthService;
import ru.ruc.lk.ruk_lk_api.admin.AdminSession;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoAdminItemDto;
import ru.ruc.lk.ruk_lk_api.passphoto.dto.PassPhotoAvatarPreferenceRequest;
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

    @PutMapping("/avatar-preference")
    public PassPhotoSubmissionDto setAvatarPreference(
        HttpSession session,
        @RequestBody PassPhotoAvatarPreferenceRequest request
    ) {
        return passPhotoService.setUseAsAvatar(session, request.useAsAvatar());
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

    PassPhotoAdminController(PassPhotoService passPhotoService) {
        this.passPhotoService = passPhotoService;
    }

    @GetMapping
    public List<PassPhotoAdminItemDto> pending(HttpServletRequest request, HttpSession session) {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.listPending(admin.role());
    }

    @GetMapping("/history")
    public List<PassPhotoAdminItemDto> history(
        HttpServletRequest request,
        HttpSession session,
        @RequestParam(defaultValue = "30") int limit
    ) {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.listProcessed(admin.role(), limit);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id
    ) throws IOException {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        byte[] bytes = passPhotoService.readImageForAdmin(id, admin.role());
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
            .body(bytes);
    }

    @PostMapping("/{id}/approve")
    public PassPhotoSubmissionDto approve(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id
    ) throws IOException {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.approve(id, admin.username(), admin.role());
    }

    @PostMapping("/{id}/reject")
    public PassPhotoSubmissionDto reject(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id,
        @RequestBody PassPhotoRejectRequest body
    ) {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.reject(id, admin.username(), body.reason(), admin.role());
    }

    @PostMapping("/{id}/retry-perco")
    public PassPhotoSubmissionDto retryPerco(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id
    ) throws IOException {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.retryPerco(id, admin.username(), admin.role());
    }

    @PostMapping("/{id}/allow-resubmit")
    public PassPhotoAdminItemDto allowResubmit(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id
    ) {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        return passPhotoService.allowResubmit(id, admin.role());
    }

    @PostMapping("/{id}/revert")
    public Map<String, String> revert(
        HttpServletRequest request,
        HttpSession session,
        @PathVariable UUID id
    ) throws IOException {
        AdminSession admin = AdminAuthService.requireRole(session, AdminAuthService.parseRoleHeader(request));
        passPhotoService.revert(id, admin.role());
        return Map.of("ok", "true");
    }
}
