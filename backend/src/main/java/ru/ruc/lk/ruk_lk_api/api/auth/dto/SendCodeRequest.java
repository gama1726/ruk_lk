package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import ru.ruc.lk.ruk_lk_api.api.auth.LoginCodeChannel;

public record SendCodeRequest(LoginCodeChannel channel) {
    public LoginCodeChannel channelOrDefault() {
        return channel == null ? LoginCodeChannel.EMAIL : channel;
    }
}
