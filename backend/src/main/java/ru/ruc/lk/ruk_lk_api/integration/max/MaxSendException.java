package ru.ruc.lk.ruk_lk_api.integration.max;

public class MaxSendException extends RuntimeException {

    public MaxSendException(String message) {
        super(message);
    }

    public MaxSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
