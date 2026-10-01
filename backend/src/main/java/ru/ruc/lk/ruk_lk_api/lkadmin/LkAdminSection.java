package ru.ruc.lk.ruk_lk_api.lkadmin;

/** Разделы админ-панели ЛК (галочки при создании учётки). */
public enum LkAdminSection {
    ATTENDANCE,
    ABSENCE_REPORT_KAZAN,
    ABSENCE_REPORT_KRASNODAR,
    ABSENCE_REPORT_HEAD,
    EVENTS,
    API_LOAD,
    CABINET_STATS,
    ADMINS;

    public static LkAdminSection forAbsenceCampus(LkAbsenceReportCampus campus) {
        if (campus == null) {
            return ABSENCE_REPORT_KRASNODAR;
        }
        return switch (campus) {
            case KAZAN -> ABSENCE_REPORT_KAZAN;
            case KRASNODAR -> ABSENCE_REPORT_KRASNODAR;
            case HEAD -> ABSENCE_REPORT_HEAD;
        };
    }

    public static boolean isAbsenceReportSection(LkAdminSection section) {
        return section == ABSENCE_REPORT_KAZAN
            || section == ABSENCE_REPORT_KRASNODAR
            || section == ABSENCE_REPORT_HEAD;
    }
}
