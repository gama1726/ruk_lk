package ru.ruc.lk.ruk_lk_api.metrics;

/**
 * Явная операция исходящего вызова (поверх HTTP path), чтобы отличать
 * login-code / email-change / message и т.п.
 */
public final class OutboundOperationContext {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private OutboundOperationContext() {}

    public static String peek() {
        return CURRENT.get();
    }

    public static String peekOr(String fallback) {
        String v = CURRENT.get();
        return v == null || v.isBlank() ? fallback : v;
    }

    public static void call(String operation, Runnable action) {
        String previous = CURRENT.get();
        CURRENT.set(normalize(operation));
        try {
            action.run();
        } finally {
            if (previous == null) {
                CURRENT.remove();
            } else {
                CURRENT.set(previous);
            }
        }
    }

    public static <T> T call(String operation, java.util.concurrent.Callable<T> action) {
        String previous = CURRENT.get();
        CURRENT.set(normalize(operation));
        try {
            return action.call();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            if (previous == null) {
                CURRENT.remove();
            } else {
                CURRENT.set(previous);
            }
        }
    }

    private static String normalize(String operation) {
        if (operation == null || operation.isBlank()) {
            return "unknown";
        }
        String s = operation.trim().replace('_', '-');
        return s.length() > 120 ? s.substring(0, 120) : s;
    }
}
