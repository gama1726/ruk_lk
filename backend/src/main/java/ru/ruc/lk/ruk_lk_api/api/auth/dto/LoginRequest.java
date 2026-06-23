package ru.ruc.lk.ruk_lk_api.api.auth.dto;

public record LoginRequest(
    String recordBookNumber,//номер зачётки
    String password//пароль
    ){}