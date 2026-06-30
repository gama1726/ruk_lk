package ru.ruc.lk.ruk_lk_api.passphoto;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import ru.ruc.lk.ruk_lk_api.passphoto.ml.FaceDetectionOutcome;
import ru.ruc.lk.ruk_lk_api.passphoto.ml.PassPhotoBackgroundAnalyzer;
import ru.ruc.lk.ruk_lk_api.passphoto.ml.PassPhotoBackgroundAnalyzer.BackgroundStats;
import ru.ruc.lk.ruk_lk_api.passphoto.ml.PassPhotoFaceBox;
import ru.ruc.lk.ruk_lk_api.passphoto.ml.PassPhotoFaceDetector;
import ru.ruc.lk.ruk_lk_api.passphoto.ml.PassPhotoPersonRegion;

/**
 * Автопроверка фото для пропуска: YuNet (лицо) + анализ фона с маской человека.
 */
@Service
public class PassPhotoValidationService {

    private final PassPhotoProperties properties;
    private final PassPhotoFaceDetector faceDetector;

    public PassPhotoValidationService(PassPhotoProperties properties, PassPhotoFaceDetector faceDetector) {
        this.properties = properties;
        this.faceDetector = faceDetector;
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
            image = ImageIO.read(new ByteArrayInputStream(bytes));
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
                "Слишком маленькое фото. Снимите ближе или выберите файл большего разрешения."));
        }

        if (faceDetector.isAvailable()) {
            FaceDetectionOutcome outcome = faceDetector.detect(image);
            if (outcome.detectorFailed()) {
                validateWithHeuristics(image, issues);
            } else {
                validateWithMl(image, issues, outcome.faces());
            }
        } else {
            validateWithHeuristics(image, issues);
        }

        return new PassPhotoValidationResult(issues);
    }

    private void validateWithMl(BufferedImage image, List<PassPhotoIssue> issues, List<PassPhotoFaceBox> faces) {
        if (faces.isEmpty()) {
            issues.add(issue(PassPhotoIssueCode.NO_FACE, PassPhotoIssueSeverity.FAIL,
                "Лицо не найдено. Снимите себя анфас, голова и плечи в кадре."));
            return;
        }
        if (faces.size() > 1) {
            issues.add(issue(PassPhotoIssueCode.MULTIPLE_FACES, PassPhotoIssueSeverity.FAIL,
                "В кадре должно быть только одно лицо."));
            return;
        }

        PassPhotoFaceBox face = faces.get(0);
        double faceHeightRatio = (double) face.height() / image.getHeight();
        if (faceHeightRatio < properties.minFaceHeightRatio()) {
            issues.add(issue(PassPhotoIssueCode.FACE_TOO_SMALL, PassPhotoIssueSeverity.FAIL,
                "Лицо слишком маленькое. Подойдите ближе к камере."));
        }

        PassPhotoPersonRegion person = PassPhotoPersonRegion.fromFace(face, image.getWidth(), image.getHeight());
        BackgroundStats background = PassPhotoBackgroundAnalyzer.sample(image, person);
        if (background.sampleCount() < 80) {
            issues.add(issue(PassPhotoIssueCode.BACKGROUND_NOT_UNIFORM, PassPhotoIssueSeverity.WARN,
                "Мало свободного фона в кадре. Снимите чуть дальше от стены."));
        } else {
            applyBackgroundChecks(issues, background, true);
        }

        RegionStats faceStats = sampleRect(image, face.x(), face.y(), face.width(), face.height());
        applyFaceRegionChecks(issues, faceStats);

        double sharpness = laplacianVarianceInRect(
            image,
            expandRect(face, image.getWidth(), image.getHeight(), 0.15)
        );
        applySharpnessChecks(issues, sharpness);
    }

    private void validateWithHeuristics(BufferedImage image, List<PassPhotoIssue> issues) {
        EdgeStats edge = sampleEdges(image);
        applyBackgroundChecks(issues, new BackgroundStats(
            edge.meanBrightness, edge.darkPixelRatio, edge.colorSpread, 1
        ), false);

        OvalStats face = sampleFaceOval(image);
        applyFaceRegionChecks(issues, new RegionStats(face.meanBrightness, face.stdDev));

        double sharpness = laplacianVariance(image, face);
        applySharpnessChecks(issues, sharpness);
    }

    private void applyBackgroundChecks(List<PassPhotoIssue> issues, BackgroundStats edge, boolean mlMode) {
        double meanFail = mlMode ? 140 : 150;
        double meanWarn = mlMode ? 155 : 170;
        double darkFail = mlMode ? 0.38 : 0.25;

        if (edge.meanBrightness() < meanFail) {
            issues.add(issue(PassPhotoIssueCode.BACKGROUND_TOO_DARK, PassPhotoIssueSeverity.FAIL,
                "Фон слишком тёмный. Сфотографируйтесь у светлой стены."));
        } else if (edge.meanBrightness() < meanWarn) {
            issues.add(issue(PassPhotoIssueCode.BACKGROUND_TOO_DARK, PassPhotoIssueSeverity.WARN,
                "Фон немного тёмный. Лучше снимать у более светлой стены."));
        }

        if (edge.darkPixelRatio() > darkFail) {
            issues.add(issue(PassPhotoIssueCode.BACKGROUND_TOO_DARK, PassPhotoIssueSeverity.FAIL,
                "На фоне слишком много тёмных участков."));
        }

        if (!mlMode && edge.colorSpread() > 35) {
            issues.add(issue(PassPhotoIssueCode.BACKGROUND_NOT_UNIFORM, PassPhotoIssueSeverity.WARN,
                "Фон неоднородный. Используйте светлую однотонную стену без предметов."));
        }
    }

    private void applyFaceRegionChecks(List<PassPhotoIssue> issues, RegionStats face) {
        if (face.meanBrightness < 70) {
            issues.add(issue(PassPhotoIssueCode.FACE_AREA_TOO_DARK, PassPhotoIssueSeverity.FAIL,
                "Лицо слишком тёмное. Включите свет или подойдите к окну."));
        } else if (face.meanBrightness < 85) {
            issues.add(issue(PassPhotoIssueCode.FACE_AREA_TOO_DARK, PassPhotoIssueSeverity.WARN,
                "Освещение лица слабовато."));
        }

        if (face.meanBrightness > 238) {
            issues.add(issue(PassPhotoIssueCode.FACE_AREA_TOO_BRIGHT, PassPhotoIssueSeverity.FAIL,
                "Слишком ярко / пересвет. Отойдите от прямого света."));
        }

        if (face.stdDev < 18) {
            issues.add(issue(PassPhotoIssueCode.CENTER_TOO_UNIFORM, PassPhotoIssueSeverity.FAIL,
                "В центре кадра не видно лица. Снимите себя анфас, голова и плечи в кадре."));
        } else if (face.stdDev < 24) {
            issues.add(issue(PassPhotoIssueCode.FACE_AREA_LOW_DETAIL, PassPhotoIssueSeverity.WARN,
                "Лицо плохо различимо. Подойдите ближе к камере."));
        }
    }

    private void applySharpnessChecks(List<PassPhotoIssue> issues, double sharpness) {
        if (sharpness < 35) {
            issues.add(issue(PassPhotoIssueCode.IMAGE_TOO_BLURRY, PassPhotoIssueSeverity.FAIL,
                "Фото размыто. Держите телефон неподвижно и сфокусируйтесь на лице."));
        } else if (sharpness < 55) {
            issues.add(issue(PassPhotoIssueCode.IMAGE_TOO_BLURRY, PassPhotoIssueSeverity.WARN,
                "Фото немного смазано."));
        }
    }

    /**
     * JPEG сохраняем как есть; BMP и PNG конвертируем в JPEG для хранения и Perco.
     */
    public byte[] normalizeForStorage(byte[] bytes, String contentType) throws IOException {
        if (isJpeg(bytes, contentType)) {
            return bytes;
        }
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
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

    private static RegionStats sampleRect(BufferedImage image, int rx, int ry, int rw, int rh) {
        int xEnd = Math.min(image.getWidth(), rx + rw);
        int yEnd = Math.min(image.getHeight(), ry + rh);
        int xStart = Math.max(0, rx);
        int yStart = Math.max(0, ry);

        long sum = 0;
        long sumSq = 0;
        long count = 0;

        for (int y = yStart; y < yEnd; y++) {
            for (int x = xStart; x < xEnd; x++) {
                int rgb = image.getRGB(x, y);
                int yVal = luminanceRgb(rgb);
                sum += yVal;
                sumSq += (long) yVal * yVal;
                count++;
            }
        }

        if (count == 0) {
            return new RegionStats(0, 0);
        }
        double mean = (double) sum / count;
        double variance = (double) sumSq / count - mean * mean;
        return new RegionStats(mean, Math.sqrt(Math.max(0, variance)));
    }

    private static int[] expandRect(PassPhotoFaceBox face, int imageWidth, int imageHeight, double marginRatio) {
        int mx = (int) (face.width() * marginRatio);
        int my = (int) (face.height() * marginRatio);
        int x = Math.max(0, face.x() - mx);
        int y = Math.max(0, face.y() - my);
        int w = Math.min(imageWidth - x, face.width() + mx * 2);
        int h = Math.min(imageHeight - y, face.height() + my * 2);
        return new int[] { x, y, w, h };
    }

    private static double laplacianVarianceInRect(BufferedImage image, int[] rect) {
        int x0 = rect[0];
        int y0 = rect[1];
        int w = rect[2];
        int h = rect[3];
        int xEnd = Math.min(image.getWidth() - 1, x0 + w - 1);
        int yEnd = Math.min(image.getHeight() - 1, y0 + h - 1);

        double sum = 0;
        double sumSq = 0;
        long count = 0;

        for (int y = Math.max(1, y0); y < yEnd; y++) {
            for (int x = Math.max(1, x0); x < xEnd; x++) {
                int center = luminanceRgb(image.getRGB(x, y));
                int lap = Math.abs(4 * center
                    - luminanceRgb(image.getRGB(x - 1, y))
                    - luminanceRgb(image.getRGB(x + 1, y))
                    - luminanceRgb(image.getRGB(x, y - 1))
                    - luminanceRgb(image.getRGB(x, y + 1)));
                sum += lap;
                sumSq += (double) lap * lap;
                count++;
            }
        }

        if (count == 0) {
            return 0;
        }
        double mean = sum / count;
        return sumSq / count - mean * mean;
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

    private static EdgeStats sampleEdges(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        int bandX = Math.max(4, width / 12);
        int bandY = Math.max(4, height / 12);
        int centerLeft = width / 4;
        int centerRight = width - width / 4;
        int centerTop = height / 5;
        int centerBottom = height - height / 5;

        long sum = 0;
        long count = 0;
        int dark = 0;
        long spreadSum = 0;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                boolean edge = x < bandX || x >= width - bandX || y < bandY || y >= height - bandY;
                boolean inCenter = x >= centerLeft && x < centerRight && y >= centerTop && y < centerBottom;
                if (!edge || inCenter) {
                    continue;
                }
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                int yVal = luminance(r, g, b);
                sum += yVal;
                count++;
                if (yVal < 100) {
                    dark++;
                }
                spreadSum += Math.max(Math.abs(r - g), Math.max(Math.abs(g - b), Math.abs(r - b)));
            }
        }

        if (count == 0) {
            return new EdgeStats(0, 1, 0);
        }
        return new EdgeStats(
            (double) sum / count,
            (double) dark / count,
            (double) spreadSum / count
        );
    }

    private static OvalStats sampleFaceOval(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        double cx = width / 2.0;
        double cy = height * 0.42;
        double rx = width * 0.22;
        double ry = height * 0.28;

        long sum = 0;
        long sumSq = 0;
        long count = 0;

        int yStart = (int) Math.max(0, cy - ry);
        int yEnd = (int) Math.min(height, cy + ry);
        int xStart = (int) Math.max(0, cx - rx);
        int xEnd = (int) Math.min(width, cx + rx);

        for (int y = yStart; y < yEnd; y++) {
            for (int x = xStart; x < xEnd; x++) {
                double nx = (x - cx) / rx;
                double ny = (y - cy) / ry;
                if (nx * nx + ny * ny > 1) {
                    continue;
                }
                int yVal = luminanceRgb(image.getRGB(x, y));
                sum += yVal;
                sumSq += (long) yVal * yVal;
                count++;
            }
        }

        if (count == 0) {
            return new OvalStats(0, 0);
        }
        double mean = (double) sum / count;
        double variance = (double) sumSq / count - mean * mean;
        return new OvalStats(mean, Math.sqrt(Math.max(0, variance)));
    }

    private static double laplacianVariance(BufferedImage image, OvalStats face) {
        int width = image.getWidth();
        int height = image.getHeight();
        double cx = width / 2.0;
        double cy = height * 0.42;
        double rx = width * 0.28;
        double ry = height * 0.35;

        double sum = 0;
        double sumSq = 0;
        long count = 0;

        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                double nx = (x - cx) / rx;
                double ny = (y - cy) / ry;
                if (nx * nx + ny * ny > 1) {
                    continue;
                }
                int center = luminanceRgb(image.getRGB(x, y));
                int lap = Math.abs(4 * center
                    - luminanceRgb(image.getRGB(x - 1, y))
                    - luminanceRgb(image.getRGB(x + 1, y))
                    - luminanceRgb(image.getRGB(x, y - 1))
                    - luminanceRgb(image.getRGB(x, y + 1)));
                sum += lap;
                sumSq += (double) lap * lap;
                count++;
            }
        }

        if (count == 0) {
            return 0;
        }
        double mean = sum / count;
        return sumSq / count - mean * mean;
    }

    private static int luminanceRgb(int rgb) {
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        return luminance(r, g, b);
    }

    private static int luminance(int r, int g, int b) {
        return (int) (0.299 * r + 0.587 * g + 0.114 * b);
    }

    private record EdgeStats(double meanBrightness, double darkPixelRatio, double colorSpread) {}

    private record OvalStats(double meanBrightness, double stdDev) {}

    private record RegionStats(double meanBrightness, double stdDev) {}
}
