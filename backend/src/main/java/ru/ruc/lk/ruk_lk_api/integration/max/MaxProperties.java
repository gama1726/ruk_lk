package ru.ruc.lk.ruk_lk_api.integration.max;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.max")
public class MaxProperties {

    private boolean enabled = false;
    private boolean loginOption = false;
    private String apiUrl = "https://platform-api2.max.ru";
    private String botToken = "";
    /** Ник бота для deep link: https://max.ru/{botUsername}?start=... */
    private String botUsername = "";
    private String webhookSecret = "";
    /** HTTPS URL webhook, например https://lk.ruc.su/api/max/webhook — для автоподписки */
    private String webhookUrl = "";
    private int bindTokenTtlMinutes = 15;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isLoginOption() {
        return loginOption;
    }

    public void setLoginOption(boolean loginOption) {
        this.loginOption = loginOption;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getBotToken() {
        return botToken;
    }

    public void setBotToken(String botToken) {
        this.botToken = botToken;
    }

    public String getBotUsername() {
        return botUsername;
    }

    public void setBotUsername(String botUsername) {
        this.botUsername = botUsername;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public String getWebhookUrl() {
        return webhookUrl;
    }

    public void setWebhookUrl(String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    public int getBindTokenTtlMinutes() {
        return bindTokenTtlMinutes;
    }

    public void setBindTokenTtlMinutes(int bindTokenTtlMinutes) {
        this.bindTokenTtlMinutes = bindTokenTtlMinutes;
    }
}
