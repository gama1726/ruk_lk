package ru.ruc.lk.ruk_lk_api.imaging;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

class ExifOrientedImagesTest {

    @Test
    void orientation6RotatesClockwiseSoLeftSideBecomesTop() {
        BufferedImage source = solidHalves(32, 16, Color.RED, Color.GREEN);
        BufferedImage rotated = ExifOrientedImages.apply(source, 6);

        assertEquals(16, rotated.getWidth());
        assertEquals(32, rotated.getHeight());
        assertCloserTo(Color.RED, rotated.getRGB(8, 8));
        assertCloserTo(Color.GREEN, rotated.getRGB(8, 24));
    }

    @Test
    void readsJpegExifOrientation6AndBakesPixels() throws Exception {
        BufferedImage source = solidHalves(32, 16, Color.RED, Color.GREEN);
        byte[] jpeg = toJpeg(source);
        byte[] withExif = withJpegOrientation(jpeg, 6);

        assertEquals(6, ExifOrientedImages.jpegOrientation(withExif));

        BufferedImage read = ExifOrientedImages.read(withExif);
        assertEquals(16, read.getWidth());
        assertEquals(32, read.getHeight());
        assertCloserTo(Color.RED, read.getRGB(8, 8));
        assertCloserTo(Color.GREEN, read.getRGB(8, 24));
    }

    @Test
    void jpegWithoutExifStaysUpright() throws Exception {
        BufferedImage source = solidHalves(32, 16, Color.RED, Color.GREEN);
        byte[] jpeg = toJpeg(source);

        assertEquals(1, ExifOrientedImages.jpegOrientation(jpeg));
        BufferedImage read = ExifOrientedImages.read(jpeg);
        assertEquals(32, read.getWidth());
        assertEquals(16, read.getHeight());
        assertCloserTo(Color.RED, read.getRGB(8, 8));
        assertCloserTo(Color.GREEN, read.getRGB(24, 8));
    }

    private static BufferedImage solidHalves(int width, int height, Color left, Color right) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                image.setRGB(x, y, (x < width / 2 ? left : right).getRGB());
            }
        }
        return image;
    }

    private static void assertCloserTo(Color expected, int actualRgb) {
        Color actual = new Color(actualRgb);
        int expectedDist = dist(expected, actual);
        Color other = expected.equals(Color.RED) ? Color.GREEN : Color.RED;
        int otherDist = dist(other, actual);
        org.junit.jupiter.api.Assertions.assertTrue(expectedDist < otherDist, "pixel too far from " + expected);
    }

    private static int dist(Color a, Color b) {
        int dr = a.getRed() - b.getRed();
        int dg = a.getGreen() - b.getGreen();
        int db = a.getBlue() - b.getBlue();
        return dr * dr + dg * dg + db * db;
    }

    private static byte[] toJpeg(BufferedImage image) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);
        return out.toByteArray();
    }

    /** Вставляет APP1 Exif сразу после SOI. */
    private static byte[] withJpegOrientation(byte[] jpeg, int orientation) {
        byte[] app1 = jpegApp1ExifOrientation(orientation);
        byte[] out = new byte[jpeg.length + app1.length];
        out[0] = jpeg[0];
        out[1] = jpeg[1];
        System.arraycopy(app1, 0, out, 2, app1.length);
        System.arraycopy(jpeg, 2, out, 2 + app1.length, jpeg.length - 2);
        return out;
    }

    private static byte[] jpegApp1ExifOrientation(int orientation) {
        byte[] tiff = new byte[26];
        ByteBuffer buffer = ByteBuffer.wrap(tiff).order(ByteOrder.BIG_ENDIAN);
        buffer.put((byte) 'M');
        buffer.put((byte) 'M');
        buffer.putShort((short) 0x002A);
        buffer.putInt(8);
        buffer.putShort((short) 1);
        buffer.putShort((short) 0x0112);
        buffer.putShort((short) 3);
        buffer.putInt(1);
        buffer.putShort((short) orientation);
        buffer.putShort((short) 0);
        buffer.putInt(0);

        byte[] app1 = new byte[2 + 2 + 6 + tiff.length];
        app1[0] = (byte) 0xFF;
        app1[1] = (byte) 0xE1;
        int length = app1.length - 2;
        app1[2] = (byte) (length >> 8);
        app1[3] = (byte) length;
        byte[] header = "Exif\u0000\u0000".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        System.arraycopy(header, 0, app1, 4, 6);
        System.arraycopy(tiff, 0, app1, 10, tiff.length);
        return app1;
    }
}
