package ru.ruc.lk.ruk_lk_api.admin;

import java.util.UUID;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

/** Сессия админа пропусков в HttpSession. */
public record AdminSession(
    UUID userId,
    String username,
    EducationTrack role
) {}
