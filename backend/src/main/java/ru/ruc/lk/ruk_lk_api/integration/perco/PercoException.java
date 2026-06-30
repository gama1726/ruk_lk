package ru.ruc.lk.ruk_lk_api.integration.perco;

public class PercoException extends Exception {

    public PercoException(String message) {
        super(message);
    }

    public PercoException(String message, Throwable cause) {
        super(message, cause);
    }
}
