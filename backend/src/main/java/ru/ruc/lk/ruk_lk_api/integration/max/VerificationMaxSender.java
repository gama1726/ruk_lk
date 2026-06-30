package ru.ruc.lk.ruk_lk_api.integration.max;

public interface VerificationMaxSender {

    boolean isConfigured();

    void sendLoginCode(long maxUserId, String recipientName, String code);
}
