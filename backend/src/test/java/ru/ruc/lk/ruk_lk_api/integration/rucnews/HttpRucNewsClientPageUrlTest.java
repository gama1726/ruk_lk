package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HttpRucNewsClientPageUrlTest {

    @Test
    void buildsBitrixPaginationUrls() {
        assertEquals(
            "https://new.ruc.su/blog/",
            HttpRucNewsClient.pageUrl("https://new.ruc.su/blog/", 1)
        );
        assertEquals(
            "https://new.ruc.su/blog/?PAGEN_1=2",
            HttpRucNewsClient.pageUrl("https://new.ruc.su/blog/", 2)
        );
        assertEquals(
            "https://new.ruc.su/blog/?x=1&PAGEN_1=3",
            HttpRucNewsClient.pageUrl("https://new.ruc.su/blog/?x=1", 3)
        );
    }
}
