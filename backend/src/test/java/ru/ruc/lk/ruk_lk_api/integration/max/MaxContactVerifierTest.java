package ru.ruc.lk.ruk_lk_api.integration.max;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MaxContactVerifierTest {

    private final MaxContactVerifier verifier = new MaxContactVerifier();

    @Test
    void verifiesHashWithLiteralEscapesInVcf() {
        String token = "secret";
        String vcf = "BEGIN:VCARD\\r\\nVERSION:3.0\\r\\nN:John Doe\\r\\nEND:VCARD";
        String normalized = "BEGIN:VCARD\nVERSION:3.0\nN:John Doe\nEND:VCARD";
        String hash = hmacHex(token, normalized);

        assertTrue(verifier.verifyContactHash(vcf, hash, token));
    }

    @Test
    void verifiesHashWithRealCrlfFromJson() {
        String token = "secret";
        String vcf = "BEGIN:VCARD\r\nVERSION:3.0\r\nN:John Doe\r\nEND:VCARD";
        String hash = hmacHex(token, vcf);

        assertTrue(verifier.verifyContactHash(vcf, hash, token));
    }

    @Test
    void rejectsWrongToken() {
        String vcf = "BEGIN:VCARD\r\nEND:VCARD";
        String hash = hmacHex("secret", vcf);

        assertFalse(verifier.verifyContactHash(vcf, hash, "other"));
    }

    private static String hmacHex(String token, String vcf) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(token.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(vcf.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
