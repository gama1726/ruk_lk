package ru.ruc.lk.ruk_lk_api.passphoto;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.stereotype.Service;

import ru.ruc.lk.ruk_lk_api.imaging.ExifOrientedImages;

/**
 * Проверка фото для пропуска: формат, размер, минимальное разрешение;
 * нормализация в JPEG с даунскейлом для хранения / Perco.
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

    public long storageMaxBytes() {
        return properties.storageMaxBytes();
    }

    public PassPhotoValidationResult validate(byte[] bytes, String contentType) {
        List<PassPhotoIssue> issues = new ArrayList<>();

        if (!isSupportedFormat(bytes, contentType)) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Загрузите фото в формате JPG, JPEG, PNG, BMP или HEIC."));
            return new PassPhotoValidationResult(issues);
        }

        if (isHeic(bytes, contentType)) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "HEIC нужно конвертировать перед отправкой. Выберите файл ещё раз в приложении — конвертация выполнится автоматически."));
            return new PassPhotoValidationResult(issues);
        }

        if (bytes.length > properties.maxSizeBytes()) {
            issues.add(issue(PassPhotoIssueCode.FILE_TOO_LARGE, PassPhotoIssueSeverity.FAIL,
                "Файл слишком большой. Максимум " + formatMb(properties.maxSizeBytes()) + "."));
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
     * Фото студенческого билета: формат и вес, без жёсткого min разрешения лица.
     */
    public PassPhotoValidationResult validateIdCard(byte[] bytes, String contentType) {
        List<PassPhotoIssue> issues = new ArrayList<>();

        if (!isSupportedFormat(bytes, contentType)) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Загрузите фото студенческого билета в формате JPG, JPEG, PNG, BMP или HEIC."));
            return new PassPhotoValidationResult(issues);
        }

        if (isHeic(bytes, contentType)) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "HEIC нужно конвертировать перед отправкой. Выберите файл ещё раз в приложении — конвертация выполнится автоматически."));
            return new PassPhotoValidationResult(issues);
        }

        if (bytes.length > properties.maxSizeBytes()) {
            issues.add(issue(PassPhotoIssueCode.FILE_TOO_LARGE, PassPhotoIssueSeverity.FAIL,
                "Файл студенческого билета слишком большой. Максимум "
                    + formatMb(properties.maxSizeBytes()) + "."));
            return new PassPhotoValidationResult(issues);
        }

        BufferedImage image;
        try {
            image = ExifOrientedImages.read(bytes);
        } catch (IOException e) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Не удалось прочитать фото студенческого билета."));
            return new PassPhotoValidationResult(issues);
        }

        if (image == null) {
            issues.add(issue(PassPhotoIssueCode.INVALID_FORMAT, PassPhotoIssueSeverity.FAIL,
                "Не удалось прочитать фото студенческого билета."));
            return new PassPhotoValidationResult(issues);
        }

        if (image.getWidth() < 200 || image.getHeight() < 200) {
            issues.add(issue(PassPhotoIssueCode.IMAGE_TOO_SMALL, PassPhotoIssueSeverity.FAIL,
                "Фото студенческого билета слишком маленькое. Минимум 200×200 пикселей."));
            return new PassPhotoValidationResult(issues);
        }

        return new PassPhotoValidationResult(issues);
    }

    /**
     * Всегда JPEG с «запечённой» ориентацией, даунскейл длинной стороны и сжатие —
     * для админки и последующего ресайза в Perco (250×333).
     */
    public byte[] normalizeForStorage(byte[] bytes, String contentType) throws IOException {
        BufferedImage image = ExifOrientedImages.read(bytes);
        if (image == null) {
            throw new IOException("Не удалось прочитать изображение");
        }
        BufferedImage scaled = downscale(image, Math.max(400, properties.storageMaxEdgePx()));
        float quality = clampQuality(properties.storageJpegQuality());
        byte[] jpeg = encodeJpeg(scaled, quality);
        long ceiling = Math.max(512_000L, properties.storageMaxBytes());
        while (jpeg.length > ceiling && quality > 0.45f) {
            quality = Math.max(0.45f, quality - 0.1f);
            jpeg = encodeJpeg(scaled, quality);
        }
        if (jpeg.length > ceiling) {
            int tighterEdge = Math.max(800, properties.storageMaxEdgePx() * 2 / 3);
            scaled = downscale(image, tighterEdge);
            jpeg = encodeJpeg(scaled, 0.72f);
        }
        return jpeg;
    }

    private static BufferedImage downscale(BufferedImage source, int maxEdge) {
        int w = source.getWidth();
        int h = source.getHeight();
        int edge = Math.max(w, h);
        if (edge <= maxEdge) {
            return source;
        }
        double scale = (double) maxEdge / edge;
        int tw = Math.max(1, (int) Math.round(w * scale));
        int th = Math.max(1, (int) Math.round(h * scale));
        BufferedImage rgb = new BufferedImage(tw, th, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, tw, th);
        Image scaled = source.getScaledInstance(tw, th, Image.SCALE_SMOOTH);
        g.drawImage(scaled, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private static byte[] encodeJpeg(BufferedImage image, float quality) throws IOException {
        BufferedImage rgb = image;
        if (image.getType() != BufferedImage.TYPE_INT_RGB) {
            rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, image.getWidth(), image.getHeight());
            g.drawImage(image, 0, 0, null);
            g.dispose();
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("Не удалось сохранить JPEG");
        }
        ImageWriter writer = writers.next();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(clampQuality(quality));
            }
            writer.write(null, new IIOImage(rgb, null, null), param);
            return out.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    private static float clampQuality(float quality) {
        if (Float.isNaN(quality) || quality < 0.4f) {
            return 0.4f;
        }
        return Math.min(0.95f, quality);
    }

    private static boolean isSupportedFormat(byte[] bytes, String contentType) {
        if (isJpeg(bytes, contentType) || isPng(bytes, contentType) || isBmp(bytes, contentType)) {
            return true;
        }
        return isHeic(bytes, contentType);
    }

    private static boolean isHeic(byte[] bytes, String contentType) {
        if (contentType != null) {
            String ct = contentType.toLowerCase(Locale.ROOT);
            if (ct.contains("heic") || ct.contains("heif")) {
                return true;
            }
        }
        return looksLikeHeic(bytes);
    }

    /** ISO BMFF: ftyp + brand heic/heif/mif1/msf1. */
    private static boolean looksLikeHeic(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return false;
        }
        if (bytes[4] != 'f' || bytes[5] != 't' || bytes[6] != 'y' || bytes[7] != 'p') {
            return false;
        }
        String brands = new String(bytes, 8, Math.min(bytes.length - 8, 20), java.nio.charset.StandardCharsets.US_ASCII)
            .toLowerCase(Locale.ROOT);
        return brands.contains("heic")
            || brands.contains("heif")
            || brands.contains("mif1")
            || brands.contains("msf1");
    }

    private static boolean isJpeg(byte[] bytes, String contentType) {
        if (contentType != null) {
            String ct = contentType.toLowerCase(Locale.ROOT);
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
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("png")) {
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
            String ct = contentType.toLowerCase(Locale.ROOT);
            if (ct.contains("bmp") || ct.contains("bitmap")) {
                return true;
            }
        }
        return bytes.length >= 2 && bytes[0] == 'B' && bytes[1] == 'M';
    }

    static String formatMb(long bytes) {
        double mb = bytes / (1024.0 * 1024.0);
        if (mb >= 10) {
            return String.format(Locale.ROOT, "%.0f МБ", mb);
        }
        if (Math.abs(mb - Math.rint(mb)) < 0.05) {
            return String.format(Locale.ROOT, "%.0f МБ", mb);
        }
        return String.format(Locale.ROOT, "%.1f МБ", mb);
    }

    private static PassPhotoIssue issue(PassPhotoIssueCode code, PassPhotoIssueSeverity severity, String message) {
        return new PassPhotoIssue(code, severity, message);
    }
}
