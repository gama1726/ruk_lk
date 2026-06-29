package ru.ruc.lk.ruk_lk_api.api.student;

import java.io.Serializable;

public record ScheduleSessionContext(
    String groupName,
    String groupGuid,
    String branchGuid
) implements Serializable {}
