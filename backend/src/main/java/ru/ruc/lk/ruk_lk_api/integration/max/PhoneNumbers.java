package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Нормализация российских номеров для сравнения 1С ↔ MAX. */
final class PhoneNumbers {

    private static final Pattern VCF_TEL = Pattern.compile("TEL[^:]*:([0-9+\\s()-]+)", Pattern.CASE_INSENSITIVE);

    private PhoneNumbers() {}

    /**
     * 10 цифр без кода страны (9XXXXXXXXX) или пустая строка, если распознать не удалось.
     */
    static String normalizeRu(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
            return digits.substring(1);
        }
        if (digits.length() == 10) {
            return digits;
        }
        return "";
    }

    static String extractFromVcard(String vcfInfo) {
        if (vcfInfo == null || vcfInfo.isBlank()) {
            return "";
        }
        Matcher matcher = VCF_TEL.matcher(vcfInfo);
        if (matcher.find()) {
            return normalizeRu(matcher.group(1));
        }
        return "";
    }

    static String maskRu(String normalizedTenDigits) {
        if (normalizedTenDigits == null || normalizedTenDigits.length() != 10) {
            return "—";
        }
        String code = normalizedTenDigits.substring(0, 3);
        String tail = normalizedTenDigits.substring(8);
        return "+7 (" + code + ") ***-**-" + tail;
    }

    static String normalizeVcfForHash(String vcfInfo) {
        if (vcfInfo == null) {
            return "";
        }
        // MAX: перед HMAC заменить CRLF на LF (в JSON приходит как реальные \r\n)
        return vcfInfo
            .replace("\r\n", "\n")
            .replace('\r', '\n')
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n");
    }

    static boolean sameRuNumber(String left, String right) {
        String a = normalizeRu(left);
        String b = normalizeRu(right);
        return !a.isBlank() && a.equals(b);
    }
}
