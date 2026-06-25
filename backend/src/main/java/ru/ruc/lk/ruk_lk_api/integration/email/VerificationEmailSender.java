package ru.ruc.lk.ruk_lk_api.integration.email;

public interface VerificationEmailSender {
    /**
     * Отправляет код подтверждения на email.
     * @param toEmail адрес электронной почты из 1С
     * @param recipientName ФИО для to_name
     * @param code 6 цифр
     */
    void sendLoginCode(String toEmail, String recipientName,String code);
}