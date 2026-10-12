package ru.ruc.lk.ruk_lk_api.certificates;

public interface CertificateNotificationMailer {
    void send(String toEmail, String recipientName, String subject, String html, String plaintext);
}
