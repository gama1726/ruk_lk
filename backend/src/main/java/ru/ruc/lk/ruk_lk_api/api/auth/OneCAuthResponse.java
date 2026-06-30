package ru.ruc.lk.ruk_lk_api.api.auth;

public record OneCAuthResponse(
    boolean authenticated,
    String studentId,
    String email,
    String fullName,
    String phone,
    Long maxUserId
) {
    public OneCAuthResponse {
        if (fullName == null) {
            fullName = "";
        }
        if (email == null) {
            email = "";
        }
        if (phone == null) {
            phone = "";
        }
    }

    public OneCAuthResponse(boolean authenticated, String studentId, String email, String fullName) {
        this(authenticated, studentId, email, fullName, "", null);
    }
}
