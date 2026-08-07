package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

class RucNewsHtmlParserTest {

    @Test
    void parsesLangNewsCards() {
        String html = """
            <div class="lang-events--list">
              <a href="/blog/sample-post/" class="w-100 d-f fd-c rg-16 h:c-py tn-all-3">
                <div class="w-100 ar-16x9 r-20 bc-w bp-c bgr-nr bgs-cr bi-load lazyload"
                     data-bg="/upload/iblock/abc/preview.jpg"></div>
                <time class="ftw-4">7 августа 2026</time>
                <div class="f-18 lg:f-24 ftw-5 lh-1">Заголовок &quot;новости&quot;</div>
              </a>
              <a href="/blog/" class="w-100 d-f fd-c rg-16 h:c-py tn-all-3">
                <div data-bg="/x.jpg"></div>
                <time>1 января 2020</time>
                <div class="f-18">Пропуск</div>
              </a>
            </div>
            """;

        List<RucNewsItem> items = RucNewsHtmlParser.parse(html, "https://new.ruc.su");
        assertEquals(1, items.size());
        RucNewsItem item = items.getFirst();
        assertEquals("sample-post", item.id());
        assertEquals("Заголовок \"новости\"", item.title());
        assertEquals("2026-08-07", item.date());
        assertEquals("https://new.ruc.su/blog/sample-post/", item.url());
        assertTrue(item.imageUrl().endsWith("/upload/iblock/abc/preview.jpg"));
        assertFalse(item.imageUrl().startsWith("/upload"));
    }
}
