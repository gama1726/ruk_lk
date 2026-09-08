package ru.ruc.lk.ruk_lk_api.integration.skud;

/**
 * Нормализованное событие прохода (Perco, ZKBio и др.).
 *
 * @param direction {@code IN} / {@code OUT} по зонам; {@code UNKNOWN} если направления нет
 */
public record SkudAccessEvent(String timeLabel, String gate, Direction direction) {

    public SkudAccessEvent(String timeLabel, String gate) {
        this(timeLabel, gate, Direction.UNKNOWN);
    }

    public enum Direction {
        IN,
        OUT,
        UNKNOWN
    }
}
