package ru.ruc.lk.ruk_lk_api.integration.zkbio;

public class ZKBioException extends Exception {

    public static final String NOT_ENROLLED =
        "Ваш номер зачётки не добавлен в сервис посещений";

    private final boolean notEnrolled;

    public ZKBioException(String message) {
        this(message, false, null);
    }

    public ZKBioException(String message, Throwable cause) {
        this(message, false, cause);
    }

    public static ZKBioException notEnrolled() {
        return new ZKBioException(NOT_ENROLLED, true, null);
    }

    private ZKBioException(String message, boolean notEnrolled, Throwable cause) {
        super(message, cause);
        this.notEnrolled = notEnrolled;
    }

    public boolean isNotEnrolled() {
        return notEnrolled;
    }
}
