package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.Set;
import java.util.UUID;

public record LkAdminSession(
    UUID userId,
    String username,
    String fullName,
    boolean superAdmin,
    Set<LkAdminSection> sections
) {
    public boolean hasSection(LkAdminSection section) {
        if (superAdmin) {
            return true;
        }
        return sections != null && sections.contains(section);
    }
}
