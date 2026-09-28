package ru.ruc.lk.ruk_lk_api.integration.email;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

public record UnisenderSendRequest(Message message) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
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
        List<String> tags,
        List<Attachment> attachments
    ) {
        public Message(
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
        ) {
            this(
                recipients,
                subject,
                from_email,
                from_name,
                global_language,
                template_engine,
                track_links,
                track_read,
                body,
                tags,
                null
            );
        }
    }

    public record Recipient(String email, Map<String, String> substitutions) {}

    public record Body(String html, String plaintext) {}

    public record Attachment(String type, String name, String content) {}
}
