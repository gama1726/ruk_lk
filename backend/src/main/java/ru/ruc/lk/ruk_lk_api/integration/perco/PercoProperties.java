package ru.ruc.lk.ruk_lk_api.integration.perco;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.perco")
public record PercoProperties(
    boolean enabled,
    String baseUrl,
    String login,
    String password,
    boolean trustSelfSigned,
    Integer divisionId,
    Integer accessTemplateId,
    int photoWidth,
    int photoHeight,
    /** Имя зоны «улица» в Perco для IN/OUT. */
    String uncontrolledZone
) {
    public PercoProperties {
        if (photoWidth <= 0) {
            photoWidth = 250;
        }
        if (photoHeight <= 0) {
            photoHeight = 333;
        }
        if (uncontrolledZone == null || uncontrolledZone.isBlank()) {
            uncontrolledZone = "Неконтролируемая территория";
        }
    }
}
