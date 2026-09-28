package ru.ruc.lk.ruk_lk_api.integration.email;

/** Отправка PDF-уведомления о непосещаемости (Казань). */
public interface AbsenceNoticeEmailSender {

    void sendAbsenceNotice(
        String toEmail,
        String recipientName,
        String studentFullName,
        String absenceDateRu,
        byte[] pdfBytes,
        String pdfFileName
    );
}
