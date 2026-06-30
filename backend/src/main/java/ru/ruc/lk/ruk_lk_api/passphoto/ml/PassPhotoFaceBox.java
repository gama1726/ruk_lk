package ru.ruc.lk.ruk_lk_api.passphoto.ml;

/**
 * Обнаруженное лицо (YuNet): bbox в пикселях исходного изображения.
 */
public record PassPhotoFaceBox(
    int x,
    int y,
    int width,
    int height,
    float score
) {
    public int centerX() {
        return x + width / 2;
    }

    public int centerY() {
        return y + height / 2;
    }
}
