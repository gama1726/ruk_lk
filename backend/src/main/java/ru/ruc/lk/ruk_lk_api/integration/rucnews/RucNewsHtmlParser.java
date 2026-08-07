package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Парсер HTML ленты {@code /blog/} (шаблон lang.news).
 */
final class RucNewsHtmlParser {

    private static final Pattern CARD = Pattern.compile(
        "<a href=\"(/blog/[^\"]+)\" class=\"[^\"]*w-100 d-f fd-c rg-16[^\"]*\""
            + "[\\s\\S]*?data-bg=\"([^\"]*)\""
            + "[\\s\\S]*?<time[^>]*>([^<]*)</time>"
            + "[\\s\\S]*?<div class=\"f-18[^\"]*\">([\\s\\S]*?)</div>",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TAGS = Pattern.compile("<[^>]+>");
    private static final DateTimeFormatter RU_DATE =
        DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru"));

    private static final Map<String, String> SKIP_PATHS = Map.of(
        "/blog/", "1",
        "/blog/novosti/", "1",
        "/blog/stati/", "1"
    );

    private RucNewsHtmlParser() {}

    static List<RucNewsItem> parse(String html, String baseUrl) {
        if (html == null || html.isBlank()) {
            return List.of();
        }
        String origin = baseUrl == null ? "https://new.ruc.su" : baseUrl.replaceAll("/+$", "");
        Map<String, RucNewsItem> byId = new LinkedHashMap<>();
        Matcher matcher = CARD.matcher(html);
        while (matcher.find()) {
            String path = matcher.group(1).trim();
            if (SKIP_PATHS.containsKey(path) || path.contains("?")) {
                continue;
            }
            String imagePath = matcher.group(2).trim();
            String dateRaw = matcher.group(3).trim();
            String title = decodeHtml(TAGS.matcher(matcher.group(4)).replaceAll("").trim());
            if (title.isBlank()) {
                continue;
            }
            String id = path.replaceAll("^/blog/|/$", "");
            if (id.isBlank()) {
                continue;
            }
            String url = path.startsWith("http") ? path : origin + path;
            String imageUrl = absoluteUrl(origin, imagePath);
            String isoDate = toIsoDate(dateRaw);
            byId.putIfAbsent(id, new RucNewsItem(id, title, "", isoDate, url, imageUrl));
        }
        return new ArrayList<>(byId.values());
    }

    private static String absoluteUrl(String origin, String path) {
        if (path == null || path.isBlank()) {
            return "";
        }
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        if (path.startsWith("//")) {
            return "https:" + path;
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return origin + path;
    }

    private static String toIsoDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        try {
            return LocalDate.parse(raw.trim().toLowerCase(Locale.ROOT), RU_DATE).toString();
        } catch (Exception ignored) {
            return "";
        }
    }

    private static String decodeHtml(String value) {
        return value
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&nbsp;", " ")
            .replace("«", "«")
            .replace("»", "»");
    }
}
