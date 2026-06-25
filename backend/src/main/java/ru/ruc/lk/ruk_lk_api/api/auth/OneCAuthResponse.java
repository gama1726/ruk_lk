package ru.ruc.lk.ruk_lk_api.api.auth;

public record OneCAuthResponse(
    boolean authenticated,
    String studentId,
    String email,
    String fullName
) {
    public OneCAuthResponse {
        if (fullName == null){
            fullName = "";
        }
        if (email == null) {
            email = "";
        }
    }
}
