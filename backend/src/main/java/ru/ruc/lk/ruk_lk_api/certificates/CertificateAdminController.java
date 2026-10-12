package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsUpdateRequest;

@RestController
@RequestMapping("/api/admin/lk/certificates")
public class CertificateAdminController {

    private final CertificateAdminService service;

    public CertificateAdminController(CertificateAdminService service) {
        this.service = service;
    }

    @GetMapping("/{campus}")
    public List<CertificateRequestSummaryDto> list(@PathVariable String campus, HttpSession session) {
        return service.list(session, campus);
    }

    @GetMapping("/{campus}/settings")
    public CertificateSettingsDto settings(@PathVariable String campus, HttpSession session) {
        return service.getSettings(session, campus);
    }

    @PutMapping("/{campus}/settings")
    public CertificateSettingsDto updateSettings(
        @PathVariable String campus,
        @RequestBody CertificateSettingsUpdateRequest body,
        HttpSession session
    ) {
        return service.updateSettings(session, campus, body);
    }
}
