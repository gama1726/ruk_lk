package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

/**
 * Доступные бланки PDF-уведомлений: кампус × СПО/ВО.
 * Нет бланка → рассылка не выполняется.
 */
public enum AbsenceNoticeTemplate {
    KAZAN_SPO,
    KAZAN_HE;

    public static Optional<AbsenceNoticeTemplate> resolve(
        LkAbsenceReportCampus campus,
        EducationTrack track
    ) {
        if (campus == null || track == null) {
            return Optional.empty();
        }
        if (campus != LkAbsenceReportCampus.KAZAN) {
            return Optional.empty();
        }
        return switch (track) {
            case SPO -> Optional.of(KAZAN_SPO);
            case HE -> Optional.of(KAZAN_HE);
        };
    }
}
