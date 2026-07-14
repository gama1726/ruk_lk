package ru.ruc.lk.ruk_lk_api.integration.max;

public interface VerificationMaxSender {
    boolean isConfigured();

    void sendMessage(long maxUserId, String text);

    default void sendLoginCode(long maxUserId, String recipientName, String code) {
        String safeName = recipientName == null || recipientName.isBlank()
            ? "студент"
            : recipientName.trim();
        sendMessage(
            maxUserId,
            "Здравствуйте, " + safeName + "!\n\n"
                + "Код для входа в личный кабинет РУК: " + code + "\n\n"
                + "Никому не сообщайте этот код."
        );
    }
}
