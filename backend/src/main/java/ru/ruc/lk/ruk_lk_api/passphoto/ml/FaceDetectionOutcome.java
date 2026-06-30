package ru.ruc.lk.ruk_lk_api.passphoto.ml;

import java.util.List;

/**
 * Результат детекции лица: список bbox или сбой детектора (для fallback на эвристики).
 */
public record FaceDetectionOutcome(List<PassPhotoFaceBox> faces, boolean detectorFailed) {

    public static FaceDetectionOutcome success(List<PassPhotoFaceBox> faces) {
        return new FaceDetectionOutcome(faces, false);
    }

    public static FaceDetectionOutcome failed() {
        return new FaceDetectionOutcome(List.of(), true);
    }
}
