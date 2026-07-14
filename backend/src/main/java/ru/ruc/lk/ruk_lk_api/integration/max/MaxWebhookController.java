package ru.ruc.lk.ruk_lk_api.integration.max;

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
        if (!expected.isBlank() && !expected.equals(secret == null ? "" : secret.trim())) {
            log.warn("MAX webhook: неверный secret");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (body != null && "bot_started".equals(body.updateType())) {
            Long userId = body.user() == null ? null : body.user().userId();
            String payload = body.payload();
            if (userId != null && payload != null && !payload.isBlank()) {
                bindingService.completeBind(payload, userId);
            } else {
                log.info("MAX webhook bot_started без payload или user_id");
            }
        }

        return ResponseEntity.ok().build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MaxUpdate(
        String update_type,
        String payload,
        MaxUser user
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
}
