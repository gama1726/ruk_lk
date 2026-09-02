package ru.ruc.lk.ruk_lk_api.api.auth;

import java.time.Instant;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;

record PendingParentFamily(
    String studentId,
    String studentFullName,
    boolean studentAdult,
    List<OneCParentMember> parents
) {}

record PendingParentMember(
    String studentId,
    String studentFullName,
    boolean studentAdult,
    int memberIndex,
    String relation,
    String parentFullName,
    String email,
    String phone,
    boolean isCustomer,
    boolean servicesBlocked
) {}

record PendingParentChallenge(
    PendingParentMember member,
    String code,
    Instant createdAt,
    int failedAttempts
) {
    PendingParentChallenge withFailedAttempts(int attempts) {
        return new PendingParentChallenge(member, code, createdAt, attempts);
    }
}
