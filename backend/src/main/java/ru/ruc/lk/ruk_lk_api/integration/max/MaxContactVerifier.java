package ru.ruc.lk.ruk_lk_api.integration.max;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Locale;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

@Component
public class MaxContactVerifier {

    /**
     * Проверяет подпись контакта из кнопки request_contact (HMAC-SHA256 от vcf_info ключом bot token).
     */
    public boolean verifyContactHash(String vcfInfo, String hash, String botToken) {
        if (vcfInfo == null || vcfInfo.isBlank() || hash == null || hash.isBlank()) {
            return false;
        }
        if (botToken == null || botToken.isBlank()) {
            return false;
        }
        String normalized = PhoneNumbers.normalizeVcfForHash(vcfInfo);
        String expected = hmacSha256Hex(botToken, normalized);
        return constantTimeEquals(expected, hash.trim().toLowerCase(Locale.ROOT));
    }

    public String phoneFromContact(String vcfInfo, String vcfPhone) {
        String fromVcard = PhoneNumbers.extractFromVcard(vcfInfo);
        if (!fromVcard.isBlank()) {
            return fromVcard;
        }
        return PhoneNumbers.normalizeRu(vcfPhone);
    }

    private static String hmacSha256Hex(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        byte[] left = a.getBytes(StandardCharsets.UTF_8);
        byte[] right = b.getBytes(StandardCharsets.UTF_8);
        return java.security.MessageDigest.isEqual(left, right);
    }
}
