package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportCampusSettingsDto;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportSettingsResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportSettingsUpdateRequest;

@Service
@EnableConfigurationProperties(AbsenceReportProperties.class)
public class LkAbsenceReportSettingsService {

    private final AbsenceReportProperties properties;
    private final LkAbsenceReportSettingsRepository repository;

    public LkAbsenceReportSettingsService(
        AbsenceReportProperties properties,
        LkAbsenceReportSettingsRepository repository
    ) {
        this.properties = properties;
        this.repository = repository;
    }

    public boolean isEffectiveAuto(LkAbsenceReportCampus campus) {
        return properties.flagAutoEnabled(campus) && uiAuto(campus);
    }

    public boolean isEffectiveNotify(LkAbsenceReportCampus campus) {
        return properties.flagNotifyEnabled(campus) && uiNotify(campus);
    }

    @Transactional(readOnly = true)
    public AbsenceReportSettingsResponse get(HttpSession session) {
        LkAdminAuthService.requireSuperAdmin(session);
        return snapshot();
    }

    @Transactional
    public AbsenceReportSettingsResponse update(HttpSession session, AbsenceReportSettingsUpdateRequest body) {
        LkAdminAuthService.requireSuperAdmin(session);
        if (body == null || body.campuses() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        for (AbsenceReportSettingsUpdateRequest.CampusToggle toggle : body.campuses()) {
            if (toggle == null || toggle.campus() == null || toggle.campus().isBlank()) {
                continue;
            }
            LkAbsenceReportCampus campus = LkAbsenceReportCampus.fromRequest(toggle.campus());
            LkAbsenceReportSettingsEntity row = repository.findById(campus)
                .orElseGet(() -> new LkAbsenceReportSettingsEntity(campus));
            if (toggle.autoEnabled() != null) {
                row.setAutoEnabled(toggle.autoEnabled());
            }
            if (toggle.notifyEnabled() != null) {
                row.setNotifyEnabled(toggle.notifyEnabled());
            }
            repository.save(row);
        }
        return snapshot();
    }

    private AbsenceReportSettingsResponse snapshot() {
        List<AbsenceReportCampusSettingsDto> list = new ArrayList<>();
        for (LkAbsenceReportCampus campus : LkAbsenceReportCampus.values()) {
            list.add(toDto(campus));
        }
        return new AbsenceReportSettingsResponse(properties.autoCron(), list);
    }

    private AbsenceReportCampusSettingsDto toDto(LkAbsenceReportCampus campus) {
        boolean uiAuto = uiAuto(campus);
        boolean uiNotify = uiNotify(campus);
        boolean flagAuto = properties.flagAutoEnabled(campus);
        boolean flagNotify = properties.flagNotifyEnabled(campus);
        return new AbsenceReportCampusSettingsDto(
            campus.name(),
            campus.campusLabel(),
            uiAuto,
            uiNotify,
            flagAuto,
            flagNotify,
            flagAuto && uiAuto,
            flagNotify && uiNotify
        );
    }

    private boolean uiAuto(LkAbsenceReportCampus campus) {
        return repository.findById(campus)
            .map(LkAbsenceReportSettingsEntity::isAutoEnabled)
            .orElse(true);
    }

    private boolean uiNotify(LkAbsenceReportCampus campus) {
        return repository.findById(campus)
            .map(LkAbsenceReportSettingsEntity::isNotifyEnabled)
            .orElse(true);
    }
}
