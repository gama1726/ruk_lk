package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsUpdateRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminAuthService;

@Service
public class CertificateAdminService {

    private final CertificateRequestRepository requestRepository;
    private final CertificateSettingsRepository settingsRepository;

    public CertificateAdminService(
        CertificateRequestRepository requestRepository,
        CertificateSettingsRepository settingsRepository
    ) {
        this.requestRepository = requestRepository;
        this.settingsRepository = settingsRepository;
    }

    @Transactional(readOnly = true)
    public List<CertificateRequestSummaryDto> list(HttpSession session, String campusRaw) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireCertificateCampus(session, campus);
        return requestRepository.findByCampusOrderByCreatedAtDesc(campus).stream()
            .map(CertificateAdminService::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public CertificateSettingsDto getSettings(HttpSession session, String campusRaw) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireCertificateCampus(session, campus);
        return toSettingsDto(loadOrCreate(campus));
    }

    @Transactional
    public CertificateSettingsDto updateSettings(
        HttpSession session,
        String campusRaw,
        CertificateSettingsUpdateRequest body
    ) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireCertificateCampus(session, campus);
        CertificateSettingsEntity row = loadOrCreate(campus);
        String email = body == null ? null : body.notifyEmail();
        if (email != null && !email.isBlank() && !email.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректный email");
        }
        row.setNotifyEmail(email);
        settingsRepository.save(row);
        return toSettingsDto(row);
    }

    private CertificateSettingsEntity loadOrCreate(LkAbsenceReportCampus campus) {
        return settingsRepository.findById(campus)
            .orElseGet(() -> settingsRepository.save(new CertificateSettingsEntity(campus)));
    }

    static CertificateRequestSummaryDto toSummary(CertificateRequestEntity row) {
        return new CertificateRequestSummaryDto(
            row.getId().toString(),
            row.getStudentId(),
            row.getStudentFullName(),
            row.getType().name(),
            row.getType().labelRu(),
            row.getStatus().name(),
            row.getCreatedAt()
        );
    }

    private static CertificateSettingsDto toSettingsDto(CertificateSettingsEntity row) {
        return new CertificateSettingsDto(
            row.getCampus().name().toLowerCase(Locale.ROOT),
            row.getNotifyEmail()
        );
    }
}
