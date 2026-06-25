package ru.ruc.lk.ruk_lk_api.api.auth;

public record OneCAuthResponse(
    boolean authenticated,
    String studentId,
    String email,
    String fullname
) {
    public OneCAuthResponse {
        if (fullname == null){
            fullname = "";
        }
        if (email == null) {
            email = "";
        }
    }
}
