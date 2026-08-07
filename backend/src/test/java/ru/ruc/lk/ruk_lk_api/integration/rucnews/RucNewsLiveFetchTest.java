package ru.ruc.lk.ruk_lk_api.integration.rucnews;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class RucNewsLiveFetchTest {

    @Test
    @Disabled("manual: needs network + curl; new.ruc.su TLS_RSA_*")
    void fetchesAndParsesBlog() {
        RucNewsProperties props = new RucNewsProperties(
            true,
            "https://new.ruc.su/blog/",
            "https://new.ruc.su",
            900
        );
        HttpRucNewsClient client = new HttpRucNewsClient(props);
        List<RucNewsItem> items = client.fetchLatest();
        System.out.println("items=" + items.size() + " ok=" + client.lastFetchOk());
        items.stream().limit(3).forEach(i -> System.out.println(i.date() + " | " + i.title()));
        assertTrue(client.lastFetchOk(), "fetch should succeed");
        assertFalse(items.isEmpty(), "expected news items");
    }
}
