package ru.ruc.lk.ruk_lk_api.imaging;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

import javax.imageio.ImageIO;

/**
 * {@link ImageIO} не применяет JPEG EXIF Orientation. Браузер — применяет,
 * поэтому фото на сайте выглядит нормально, а в Perco (сырые пиксели) — повёрнутым.
 */
public final class ExifOrientedImages {

    private ExifOrientedImages() {}

    public static BufferedImage read(byte[] bytes) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
        if (image == null) {
            return null;
        }
        return apply(image, jpegOrientation(bytes));
    }

    /**
     * EXIF Orientation 1–8, иначе 1 (как снято, без поворота).
     */
    public static int jpegOrientation(byte[] bytes) {
        if (bytes == null || bytes.length < 4 || (bytes[0] & 0xFF) != 0xFF || (bytes[1] & 0xFF) != 0xD8) {
            return 1;
        }
        int i = 2;
        while (i + 4 <= bytes.length) {
            if ((bytes[i] & 0xFF) != 0xFF) {
                return 1;
            }
            int marker = bytes[i + 1] & 0xFF;
            i += 2;
            if (marker == 0xD8 || marker == 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
                continue;
            }
            if (i + 2 > bytes.length) {
                return 1;
            }
            int length = ((bytes[i] & 0xFF) << 8) | (bytes[i + 1] & 0xFF);
            if (length < 2 || i + length > bytes.length) {
                return 1;
            }
            if (marker == 0xE1) {
                int orientation = orientationFromApp1(bytes, i + 2, length - 2);
                if (orientation > 0) {
                    return orientation;
                }
            }
            if (marker == 0xDA) {
                return 1;
            }
            i += length;
        }
        return 1;
    }

    public static BufferedImage apply(BufferedImage source, int orientation) {
        if (source == null || orientation <= 1 || orientation > 8) {
            return source;
        }

        int w = source.getWidth();
        int h = source.getHeight();
        boolean swap = orientation >= 5;
        int destW = swap ? h : w;
        int destH = swap ? w : h;

        AffineTransform transform = new AffineTransform();
        switch (orientation) {
            case 2 -> {
                transform.scale(-1, 1);
                transform.translate(-w, 0);
            }
            case 3 -> {
                transform.translate(w, h);
                transform.rotate(Math.PI);
            }
            case 4 -> {
                transform.scale(1, -1);
                transform.translate(0, -h);
            }
            case 5 -> {
                transform.rotate(-Math.PI / 2);
                transform.scale(-1, 1);
            }
            case 6 -> {
                transform.translate(h, 0);
                transform.rotate(Math.PI / 2);
            }
            case 7 -> {
                transform.scale(-1, 1);
                transform.translate(-h, 0);
                transform.translate(0, w);
                transform.rotate(-Math.PI / 2);
            }
            case 8 -> {
                transform.translate(0, w);
                transform.rotate(-Math.PI / 2);
            }
            default -> {
                return source;
            }
        }

        BufferedImage dest = new BufferedImage(destW, destH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dest.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, destW, destH);
        g.transform(transform);
        g.drawImage(source, 0, 0, null);
        g.dispose();
        return dest;
    }

    private static int orientationFromApp1(byte[] bytes, int offset, int length) {
        if (length < 14) {
            return 0;
        }
        String header = new String(bytes, offset, 6, StandardCharsets.US_ASCII);
        if (!"Exif\u0000\u0000".equals(header)) {
            return 0;
        }
        int tiff = offset + 6;
        int tiffLength = length - 6;
        if (tiffLength < 8) {
            return 0;
        }
        ByteOrder order;
        if (bytes[tiff] == 'I' && bytes[tiff + 1] == 'I') {
            order = ByteOrder.LITTLE_ENDIAN;
        } else if (bytes[tiff] == 'M' && bytes[tiff + 1] == 'M') {
            order = ByteOrder.BIG_ENDIAN;
        } else {
            return 0;
        }
        ByteBuffer buffer = ByteBuffer.wrap(bytes, tiff, tiffLength).slice().order(order);
        if (buffer.remaining() < 8) {
            return 0;
        }
        buffer.position(2);
        int magic = buffer.getShort() & 0xFFFF;
        if (magic != 0x002A) {
            return 0;
        }
        int ifdOffset = buffer.getInt();
        if (ifdOffset < 8 || ifdOffset + 2 > buffer.capacity()) {
            return 0;
        }
        buffer.position(ifdOffset);
        int entries = buffer.getShort() & 0xFFFF;
        for (int e = 0; e < entries; e++) {
            if (buffer.remaining() < 12) {
                return 0;
            }
            int tag = buffer.getShort() & 0xFFFF;
            int type = buffer.getShort() & 0xFFFF;
            int count = buffer.getInt();
            int valuePos = buffer.position();
            int valueOrOffset = buffer.getInt();
            if (tag != 0x0112 || count < 1) {
                continue;
            }
            int value;
            if (type == 3) {
                buffer.position(valuePos);
                value = buffer.getShort() & 0xFFFF;
            } else if (type == 4) {
                value = valueOrOffset;
            } else {
                continue;
            }
            if (value >= 1 && value <= 8) {
                return value;
            }
        }
        return 0;
    }
}
