package ru.ruc.lk.ruk_lk_api.passphoto;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import ru.ruc.lk.ruk_lk_api.imaging.ExifOrientedImages;

/**
 * Проверка фото для пропуска: только файл и изображение
 * (формат, размер, минимальное разрешение).
 */
@Service
public class PassPhotoValidationService {

    private final PassPhotoProperties properties;

    public PassPhotoValidationService(PassPhotoProperties properties) {
        this.properties = properties;
    }

    public long maxSizeBytes() {
        return properties.maxSizeBytes();
    }

    public PassPhotoValidationResult validate(byte[] bytes, String contentType) {
        List<PassPhotoIssue> issues = new ArrayList<>();

        if (!isSupportedFormat(bytes, contentType)) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Загрузите фото в формате JPG, JPEG, BMP или PNG."));
            return new PassPhotoValidationResult(issues);
        }

        if (bytes.length > properties.maxSizeBytes()) {
            issues.add(issue(PassPhotoIssueCode.FILE_TOO_LARGE, PassPhotoIssueSeverity.FAIL,
                "Файл слишком большой. Максимум 2 МБ."));
            return new PassPhotoValidationResult(issues);
        }

        BufferedImage image;
        try {
            image = ExifOrientedImages.read(bytes);
        } catch (IOException e) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Не удалось прочитать изображение."));
            return new PassPhotoValidationResult(issues);
        }

        if (image == null) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Не удалось прочитать изображение."));
            return new PassPhotoValidationResult(issues);
        }

        int width = image.getWidth();
        int height = image.getHeight();
        if (width < properties.minWidth() || height < properties.minHeight()) {
            issues.add(issue(PassPhotoIssueCode.IMAGE_TOO_SMALL, PassPhotoIssueSeverity.FAIL,
                "Слишком маленькое фото. Минимальный размер — "
                    + properties.minWidth() + "×" + properties.minHeight() + " пикселей."));
            return new PassPhotoValidationResult(issues);
        }

        return new PassPhotoValidationResult(issues);
    }

    /**
     * JPEG без EXIF-поворота сохраняем как есть. Иначе (и для BMP/PNG) пишем JPEG
     * с уже «запечённой» ориентацией — Perco EXIF не читает.
     */
    public byte[] normalizeForStorage(byte[] bytes, String contentType) throws IOException {
        if (isJpeg(bytes, contentType) && ExifOrientedImages.jpegOrientation(bytes) <= 1) {
            return bytes;
        }
        BufferedImage image = ExifOrientedImages.read(bytes);
        if (image == null) {
            throw new IOException("Не удалось прочитать изображение");
        }
        return encodeJpeg(image);
    }

    private static byte[] encodeJpeg(BufferedImage image) throws IOException {
        BufferedImage rgb = image;
        if (image.getType() != BufferedImage.TYPE_INT_RGB) {
            rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, image.getWidth(), image.getHeight());
            g.drawImage(image, 0, 0, null);
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        if (!ImageIO.write(rgb, "jpg", out)) {
            throw new IOException("Не удалось сохранить JPEG");
        }
        return out.toByteArray();
    }

    private static boolean isSupportedFormat(byte[] bytes, String contentType) {
        if (isJpeg(bytes, contentType)) {
            return true;
        }
        if (isPng(bytes, contentType)) {
            return true;
        }
        return isBmp(bytes, contentType);
    }

    private static boolean isJpeg(byte[] bytes, String contentType) {
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.contains("jpeg") || ct.contains("jpg")) {
                return true;
            }
        }
        return bytes.length >= 3
            && (bytes[0] & 0xFF) == 0xFF
            && (bytes[1] & 0xFF) == 0xD8
            && (bytes[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] bytes, String contentType) {
        if (contentType != null && contentType.toLowerCase().contains("png")) {
            return true;
        }
        return bytes.length >= 8
            && (bytes[0] & 0xFF) == 0x89
            && bytes[1] == 'P'
            && bytes[2] == 'N'
            && bytes[3] == 'G';
    }

    private static boolean isBmp(byte[] bytes, String contentType) {
        if (contentType != null) {
            String ct = contentType.toLowerCase();
            if (ct.contains("bmp") || ct.contains("bitmap")) {
                return true;
            }
        }
        return bytes.length >= 2 && bytes[0] == 'B' && bytes[1] == 'M';
    }

    private static PassPhotoIssue issue(PassPhotoIssueCode code, PassPhotoIssueSeverity severity, String message) {
        return new PassPhotoIssue(code, severity, message);
    }
}
