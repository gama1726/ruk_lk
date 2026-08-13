package ru.ruc.lk.ruk_lk_api.integration.max;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@RestController
@RequestMapping("/api/max")
public class MaxWebhookController {

    private static final Logger log = LoggerFactory.getLogger(MaxWebhookController.class);

    private final MaxBindingService bindingService;
    private final MaxProperties properties;

    public MaxWebhookController(MaxBindingService bindingService, MaxProperties properties) {
        this.bindingService = bindingService;
        this.properties = properties;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
        @RequestHeader(value = "X-Max-Bot-Api-Secret", required = false) String secret,
        @RequestBody MaxUpdate body
    ) {
        String expected = properties.getWebhookSecret() == null ? "" : properties.getWebhookSecret().trim();
        if (expected.isBlank()) {
            log.warn("MAX webhook: app.max.webhook-secret не задан");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String provided = secret == null ? "" : secret.trim();
        if (!constantTimeEquals(expected, provided)) {
            log.warn("MAX webhook: неверный secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (body == null || body.updateType() == null) {
            return ResponseEntity.ok().build();
        }

        switch (body.updateType()) {
            case "bot_started" -> handleBotStarted(body);
            case "message_created" -> handleMessageCreated(body);
            default -> { /* игнорируем прочие события */ }
        }

        return ResponseEntity.ok().build();
    }

    private void handleBotStarted(MaxUpdate body) {
        Long userId = body.user() == null ? null : body.user().userId();
        String payload = body.payload();
        if (userId != null && payload != null && !payload.isBlank()) {
            bindingService.onBotStarted(payload, userId);
        } else {
            log.info("MAX webhook bot_started без payload или user_id");
        }
    }

    private void handleMessageCreated(MaxUpdate body) {
        MaxMessage message = body.message();
        if (message == null) {
            log.info("MAX webhook message_created без message");
            return;
        }
        if (message.sender() == null) {
            log.info("MAX webhook message_created без sender");
            return;
        }
        Long userId = message.sender().userId();
        if (userId == null) {
            return;
        }

        List<MaxAttachment> attachments = message.attachments();
        if (attachments == null || attachments.isEmpty()) {
            log.debug("MAX webhook message_created user_id={} без вложений", userId);
            return;
        }

        for (MaxAttachment attachment : attachments) {
            if (attachment == null) {
                continue;
            }
            log.info("MAX webhook message_created user_id={} attachment type={}", userId, attachment.type());
            if (!"contact".equals(attachment.type())) {
                continue;
            }
            MaxContactPayload payload = attachment.payload();
            if (payload == null) {
                log.info("MAX webhook contact без payload user_id={}", userId);
                continue;
            }
            log.info("MAX webhook contact user_id={} hashPresent={}", userId, payload.hash() != null && !payload.hash().isBlank());
            bindingService.onContactShared(
                userId,
                payload.vcfInfo(),
                payload.vcfPhone(),
                payload.hash()
            );
            return;
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        byte[] left = a.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] right = b.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return java.security.MessageDigest.isEqual(left, right);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxUpdate(
        String update_type,
        String payload,
        MaxUser user,
        MaxMessage message
    ) {
        public String updateType() {
            return update_type;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxUser(Long user_id) {
        public Long userId() {
            return user_id;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxMessage(
        MaxUser sender,
        MaxMessageBody body
    ) {
        public List<MaxAttachment> attachments() {
            if (body == null || body.attachments() == null) {
                return List.of();
            }
            return body.attachments();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxMessageBody(List<MaxAttachment> attachments) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxAttachment(String type, MaxContactPayload payload) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxContactPayload(
        String vcf_info,
        String vcf_phone,
        String hash
    ) {
        public String vcfInfo() {
            return vcf_info;
        }

        public String vcfPhone() {
            return vcf_phone;
        }
    }
}
