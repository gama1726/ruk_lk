package ru.ruc.lk.ruk_lk_api.cabinet;

import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.api.student.CampusSupport;
import ru.ruc.lk.ruk_lk_api.api.student.CampusSupport.AttendanceCampus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

/** Филиал контингента пользователя ЛК (для аналитики, не для доступа). */
public enum CabinetCampus {
    KAZAN,
    KRASNODAR,
    HEAD,
    OTHER;

    public String label() {
        return switch (this) {
            case KAZAN -> "Казань";
            case KRASNODAR -> "Краснодар";
            case HEAD -> "Голова";
            case OTHER -> "Другой филиал";
        };
    }

    public static CabinetCampus fromProfile(OneCProfileResponse profile) {
        if (profile == null) {
            return OTHER;
        }
        if (CampusSupport.isKrasnodar(profile)) {
            return KRASNODAR;
        }
        Optional<AttendanceCampus> attendance = CampusSupport.resolveAttendanceCampus(profile);
        if (attendance.isEmpty()) {
            return OTHER;
        }
        return switch (attendance.get()) {
            case KAZAN -> KAZAN;
            case HEAD -> HEAD;
        };
    }
}
