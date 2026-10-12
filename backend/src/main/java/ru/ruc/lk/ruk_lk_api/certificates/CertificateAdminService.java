package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateRequestSummaryDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsDto;
import ru.ruc.lk.ruk_lk_api.certificates.dto.CertificateSettingsUpdateRequest;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAdminAuthService;

@Service
public class CertificateAdminService {

    private final CertificateRequestRepository requestRepository;
    private final CertificateSettingsRepository settingsRepository;
    private final OneCClient oneCClient;

    public CertificateAdminService(
        CertificateRequestRepository requestRepository,
        CertificateSettingsRepository settingsRepository,
        OneCClient oneCClient
    ) {
        this.requestRepository = requestRepository;
        this.settingsRepository = settingsRepository;
        this.oneCClient = oneCClient;
    }

    @Transactional(readOnly = true)
    public List<CertificateRequestSummaryDto> list(HttpSession session, String campusRaw) {
        LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(campusRaw);
        LkAdminAuthService.requireCertificateCampus(session, campus);
        List<CertificateRequestEntity> rows = requestRepository.findByCampusOrderByCreatedAtDesc(campus);
        Map<String, StudentStudyInfo> studyByStudent = new HashMap<>();
        for (CertificateRequestEntity row : rows) {
            studyByStudent.computeIfAbsent(row.getStudentId(), this::loadStudyInfo);
        }
        return rows.stream()
            .map(row -> toSummary(row, studyByStudent.get(row.getStudentId())))
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

    private StudentStudyInfo loadStudyInfo(String studentId) {
        try {
            return oneCClient.fetchProfile(studentId)
                .map(StudentStudyInfo::from)
                .orElse(StudentStudyInfo.empty());
        } catch (RuntimeException e) {
            return StudentStudyInfo.empty();
        }
    }

    static CertificateRequestSummaryDto toSummary(CertificateRequestEntity row, StudentStudyInfo study) {
        StudentStudyInfo safe = study == null ? StudentStudyInfo.empty() : study;
        return new CertificateRequestSummaryDto(
            row.getId().toString(),
            row.getStudentId(),
            row.getStudentFullName(),
            row.getType().name(),
            row.getType().labelRu(),
            row.getStatus().name(),
            row.getCreatedAt(),
            row.getApprovedFrom(),
            row.getApprovedTo(),
            row.getRejectionReason(),
            safe.group(),
            safe.faculty(),
            safe.course(),
            safe.department(),
            row.getReviewedBy(),
            row.getReviewedAt()
        );
    }

    /** Для вызовов без профиля (тесты / внутренние). */
    static CertificateRequestSummaryDto toSummary(CertificateRequestEntity row) {
        return toSummary(row, StudentStudyInfo.empty());
    }

    private static CertificateSettingsDto toSettingsDto(CertificateSettingsEntity row) {
        return new CertificateSettingsDto(
            row.getCampus().name().toLowerCase(Locale.ROOT),
            row.getNotifyEmail()
        );
    }

    record StudentStudyInfo(String group, String faculty, String course, String department) {
        static StudentStudyInfo empty() {
            return new StudentStudyInfo(null, null, null, null);
        }

        static StudentStudyInfo from(OneCProfileResponse profile) {
            return new StudentStudyInfo(
                blankToNull(profile.group()),
                blankToNull(profile.faculty()),
                blankToNull(profile.course()),
                blankToNull(profile.department())
            );
        }

        private static String blankToNull(String value) {
            return value == null || value.isBlank() ? null : value.trim();
        }
    }
}
