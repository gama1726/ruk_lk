package ru.ruc.lk.ruk_lk_api.passphoto.ml;

import java.awt.image.BufferedImage;

/**
 * Анализ фона с исключением области человека (по bbox лица).
 */
public final class PassPhotoBackgroundAnalyzer {

    private PassPhotoBackgroundAnalyzer() {}

    public record BackgroundStats(double meanBrightness, double darkPixelRatio, double colorSpread, int sampleCount) {}

    /**
     * Сэмплирует верхние углы и боковые полосы ниже головы, не попадая в {@link PassPhotoPersonRegion}.
     */
    public static BackgroundStats sample(BufferedImage image, PassPhotoPersonRegion person) {
        int width = image.getWidth();
        int height = image.getHeight();
        int cornerW = Math.max(8, width / 5);
        int cornerH = Math.max(8, height / 5);
        int bandX = Math.max(4, width / 12);

        long sum = 0;
        long count = 0;
        int dark = 0;
        long spreadSum = 0;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (person.contains(x, y)) {
                    continue;
                }
                boolean samplePixel = inTopCorner(x, y, width, cornerW, cornerH)
                    || inSideBand(x, y, width, bandX, person);
                if (!samplePixel) {
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
            return new BackgroundStats(0, 1, 0, 0);
        }
        return new BackgroundStats(
            (double) sum / count,
            (double) dark / count,
            (double) spreadSum / count,
            (int) count
        );
    }

    private static boolean inTopCorner(int x, int y, int width, int cornerW, int cornerH) {
        if (y >= cornerH) {
            return false;
        }
        return x < cornerW || x >= width - cornerW;
    }

    private static boolean inSideBand(int x, int y, int width, int bandX, PassPhotoPersonRegion person) {
        if (y < person.top()) {
            return false;
        }
        return x < bandX || x >= width - bandX;
    }

    private static int luminance(int r, int g, int b) {
        return (int) (0.299 * r + 0.587 * g + 0.114 * b);
    }
}
