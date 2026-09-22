package ru.ruc.lk.ruk_lk_api.passphoto;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

class PassPhotoValidationServiceNormalizeTest {

    @Test
    void normalizeDownscalesLargeJpegUnderStorageCap() throws Exception {
        PassPhotoProperties props = new PassPhotoProperties(
            "./data/pass-photos",
            50L * 1024 * 1024,
            400,
            500,
            false,
            0.18,
            0.6f,
            3,
            300,
            2000,
            0.85f,
            5L * 1024 * 1024
        );
        PassPhotoValidationService service = new PassPhotoValidationService(props);

        BufferedImage huge = new BufferedImage(4000, 5000, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = huge.createGraphics();
        g.setColor(Color.LIGHT_GRAY);
        g.fillRect(0, 0, 4000, 5000);
        g.setColor(Color.DARK_GRAY);
        g.fillOval(1500, 1800, 1000, 1200);
        g.dispose();

        ByteArrayOutputStream raw = new ByteArrayOutputStream();
        ImageIO.write(huge, "png", raw);
        byte[] input = raw.toByteArray();

        byte[] stored = service.normalizeForStorage(input, "image/png");
        assertTrue(stored.length > 100);
        assertTrue(stored[0] == (byte) 0xFF && stored[1] == (byte) 0xD8);
        assertTrue(stored.length <= props.storageMaxBytes());

        BufferedImage out = ImageIO.read(new java.io.ByteArrayInputStream(stored));
        assertTrue(out != null);
        assertTrue(Math.max(out.getWidth(), out.getHeight()) <= props.storageMaxEdgePx());
    }
}
