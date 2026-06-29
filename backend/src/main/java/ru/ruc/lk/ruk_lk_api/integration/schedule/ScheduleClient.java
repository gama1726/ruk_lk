package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.time.LocalDate;
import java.util.Optional;

public interface ScheduleClient {
    Optional<ScheduleGroupLookupResponse> lookupGroup(String groupName);

    Optional<ScheduleWeekApiResponse> fetchGroupWeek(String branchGuid, String groupGuid, LocalDate anchorDate);
}
