package ru.ruc.lk.ruk_lk_api.api.auth;

/** Сессия родителя после входа. */
public record ParentSession(
    String studentId,
    String studentFullName,
    boolean studentAdult,
    int memberIndex,
    String relation,
    String parentFullName,
    boolean isCustomer,
    boolean servicesBlocked,
    String parentEmail
) {
    public boolean dataAccessAllowed() {
        return !servicesBlocked;
    }
}
