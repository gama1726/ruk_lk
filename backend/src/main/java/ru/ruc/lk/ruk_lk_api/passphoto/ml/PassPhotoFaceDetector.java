package ru.ruc.lk.ruk_lk_api.passphoto.ml;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Size;
import org.opencv.objdetect.FaceDetectorYN;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import ru.ruc.lk.ruk_lk_api.passphoto.PassPhotoProperties;

/**
 * Детекция лица через YuNet (OpenCV FaceDetectorYN).
 * Размер входа выравнивается до кратности 32 — иначе OpenCV DNN падает на произвольных размерах.
 */
@Component
public class PassPhotoFaceDetector {

    private static final Logger log = LoggerFactory.getLogger(PassPhotoFaceDetector.class);
    private static final int SIZE_ALIGN = 32;

    private final PassPhotoProperties properties;
    private FaceDetectorYN detector;
    private boolean available;

    public PassPhotoFaceDetector(PassPhotoProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        if (!properties.mlEnabled()) {
            log.info("Pass photo ML disabled (app.pass-photo.ml-enabled=false)");
            return;
        }
        try {
            nu.pattern.OpenCV.loadLocally();
            Path modelPath = Files.createTempFile("ruk-lk-yunet-", ".onnx");
            modelPath.toFile().deleteOnExit();
            try (InputStream in = getClass().getResourceAsStream("/ml/yunet.onnx")) {
                if (in == null) {
                    throw new IOException("Model /ml/yunet.onnx not found in classpath");
                }
                Files.copy(in, modelPath, StandardCopyOption.REPLACE_EXISTING);
            }
            detector = FaceDetectorYN.create(
                modelPath.toString(),
                "",
                new Size(320, 320),
                properties.faceScoreThreshold(),
                0.3f,
                5000
            );
            available = true;
            log.info("Pass photo face detector (YuNet) initialized");
        } catch (Throwable e) {
            available = false;
            log.warn("Pass photo face detector unavailable, falling back to heuristics: {}", e.getMessage());
        }
    }

    public boolean isAvailable() {
        return available && detector != null;
    }

    public FaceDetectionOutcome detect(BufferedImage image) {
        if (!isAvailable()) {
            return FaceDetectionOutcome.failed();
        }

        PaddedImage padded = padForDetector(image);
        int detectW = padded.image().getWidth();
        int detectH = padded.image().getHeight();

        detector.setInputSize(new Size(detectW, detectH));

        Mat input = toBgrMat(padded.image());
        Mat faces = new Mat();
        try {
            detector.detect(input, faces);
            List<PassPhotoFaceBox> boxes = parseFaces(
                faces,
                padded.originalWidth(),
                padded.originalHeight()
            );
            return FaceDetectionOutcome.success(boxes);
        } catch (RuntimeException e) {
            log.warn("YuNet detect failed ({}x{}): {}", detectW, detectH, e.getMessage());
            return FaceDetectionOutcome.failed();
        } finally {
            input.release();
            faces.release();
        }
    }

    private record PaddedImage(BufferedImage image, int originalWidth, int originalHeight) {}

    private static PaddedImage padForDetector(BufferedImage source) {
        int ow = source.getWidth();
        int oh = source.getHeight();
        int w = alignUp(ow, SIZE_ALIGN);
        int h = alignUp(oh, SIZE_ALIGN);
        if (w == ow && h == oh) {
            return new PaddedImage(source, ow, oh);
        }
        BufferedImage padded = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = padded.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, w, h);
        g.drawImage(source, 0, 0, null);
        g.dispose();
        return new PaddedImage(padded, ow, oh);
    }

    private static int alignUp(int value, int align) {
        return ((value + align - 1) / align) * align;
    }

    private List<PassPhotoFaceBox> parseFaces(Mat faces, int imageWidth, int imageHeight) {
        List<PassPhotoFaceBox> result = new ArrayList<>();
        int rows = faces.rows();
        int cols = faces.cols();
        if (cols < 15) {
            return result;
        }
        for (int i = 0; i < rows; i++) {
            float score = (float) faces.get(i, 14)[0];
            if (score < properties.faceScoreThreshold()) {
                continue;
            }
            int x = clamp((int) faces.get(i, 0)[0], 0, imageWidth - 1);
            int y = clamp((int) faces.get(i, 1)[0], 0, imageHeight - 1);
            int w = clamp((int) faces.get(i, 2)[0], 1, imageWidth - x);
            int h = clamp((int) faces.get(i, 3)[0], 1, imageHeight - y);
            result.add(new PassPhotoFaceBox(x, y, w, h, score));
        }
        return result;
    }

    private static Mat toBgrMat(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        Mat mat = new Mat(height, width, CvType.CV_8UC3);
        byte[] data = new byte[width * height * 3];
        int idx = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                data[idx++] = (byte) (rgb & 0xFF);
                data[idx++] = (byte) ((rgb >> 8) & 0xFF);
                data[idx++] = (byte) ((rgb >> 16) & 0xFF);
            }
        }
        mat.put(0, 0, data);
        return mat;
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
