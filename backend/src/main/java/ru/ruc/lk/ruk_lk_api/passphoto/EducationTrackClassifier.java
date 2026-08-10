package ru.ruc.lk.ruk_lk_api.passphoto;

/**
 * Классификация уровня образования из 1С в трек СПО / ВО.
 */
public final class EducationTrackClassifier {

    private EducationTrackClassifier() {}

    public static EducationTrack fromLevel(String level) {
        if (level == null || level.isBlank()) {
            return EducationTrack.HE;
        }
        String normalized = level.toLowerCase().replace('ё', 'е');
        if (normalized.contains("спо")
            || normalized.contains("средн")
            || normalized.contains("колледж")) {
            return EducationTrack.SPO;
        }
        return EducationTrack.HE;
    }
}
