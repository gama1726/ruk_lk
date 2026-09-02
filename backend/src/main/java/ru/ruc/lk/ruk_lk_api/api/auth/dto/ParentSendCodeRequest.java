package ru.ruc.lk.ruk_lk_api.api.auth.dto;

import ru.ruc.lk.ruk_lk_api.api.auth.LoginCodeChannel;

public record ParentSendCodeRequest(String channel) {
    public LoginCodeChannel channelOrDefault() {
        if (channel == null || channel.isBlank()) {
            return LoginCodeChannel.EMAIL;
        }
        return LoginCodeChannel.valueOf(channel.trim().toUpperCase());
    }
}
