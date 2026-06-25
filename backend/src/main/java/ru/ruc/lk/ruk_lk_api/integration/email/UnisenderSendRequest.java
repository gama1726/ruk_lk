package ru.ruc.lk.ruk_lk_api.integration.email;

import java.util.List;
import java.util.Map;

public record UnisenderSendRequest(Message message) {
    public record Message(
        List<Recipient> recipients,
        String subject,
        String from_email,
        String from_name,
        String global_language,
        String template_engine,
        int track_links,
        int track_read,
        Body body,
        List<String> tags
    ) {}

    public record Recipient(String email, Map<String, String> substitutions) {}

    public record Body(String html, String plaintext) {}
}
