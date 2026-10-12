package ru.ruc.lk.ruk_lk_api.certificates;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.student.UniversityBranchCatalog;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceNoticeService;
import ru.ruc.lk.ruk_lk_api.lkadmin.LkAbsenceReportCampus;

@Component
public class CertificateCampusResolver {

    private final OneCClient oneCClient;

    public CertificateCampusResolver(OneCClient oneCClient) {
        this.oneCClient = oneCClient;
    }

    public LkAbsenceReportCampus requireCampusForStudent(String studentId) {
        OneCProfileResponse profile = oneCClient.fetchProfile(studentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Не удалось определить филиал студента"
            ));
        LkAbsenceReportCampus fromProfile = LkAbsenceNoticeService.resolveCampus(profile);
        if (fromProfile != null) {
            return fromProfile;
        }
        return fromBranchId(UniversityBranchCatalog.resolveFromProfile(profile).id())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Справки доступны только для Головы, Казани и Краснодара"
            ));
    }

    public static Optional<LkAbsenceReportCampus> fromBranchId(String branchId) {
        if (branchId == null || branchId.isBlank()) {
            return Optional.empty();
        }
        return switch (branchId.trim().toLowerCase()) {
            case "main" -> Optional.of(LkAbsenceReportCampus.HEAD);
            case "kazan" -> Optional.of(LkAbsenceReportCampus.KAZAN);
            case "krasnodar" -> Optional.of(LkAbsenceReportCampus.KRASNODAR);
            default -> Optional.empty();
        };
    }
}
