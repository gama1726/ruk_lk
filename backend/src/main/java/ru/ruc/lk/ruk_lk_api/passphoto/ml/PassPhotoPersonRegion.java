package ru.ruc.lk.ruk_lk_api.passphoto.ml;

/**
 * Прямоугольник «человек в кадре» — расширенный bbox лица (голова + плечи).
 */
public record PassPhotoPersonRegion(int left, int top, int right, int bottom) {

    public static PassPhotoPersonRegion fromFace(PassPhotoFaceBox face, int imageWidth, int imageHeight) {
        int left = clamp((int) (face.x() - face.width() * 0.55), 0, imageWidth);
        int top = clamp((int) (face.y() - face.height() * 0.85), 0, imageHeight);
        int right = clamp((int) (face.x() + face.width() * 1.55), 0, imageWidth);
        int bottom = clamp((int) (face.y() + face.height() * 3.0), 0, imageHeight);
        return new PassPhotoPersonRegion(left, top, right, bottom);
    }

    public boolean contains(int x, int y) {
        return x >= left && x < right && y >= top && y < bottom;
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
