package ru.ruc.lk.ruk_lk_api.integration.skud;

/** Нормализованное событие прохода (Perco, ZKBio и др.). */
public record SkudAccessEvent(String timeLabel, String gate) {}
