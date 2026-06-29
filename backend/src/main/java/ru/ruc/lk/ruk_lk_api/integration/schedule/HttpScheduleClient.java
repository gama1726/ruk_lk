package ru.ruc.lk.ruk_lk_api.integration.schedule;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class HttpScheduleClient implements ScheduleClient {

    private static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final RestClient restClient;

    public HttpScheduleClient(@Value("${app.schedule.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .build();
    }

    @Override
    public Optional<ScheduleGroupLookupResponse> lookupGroup(String groupName) {
        if (groupName == null || groupName.isBlank()) {
            return Optional.empty();
        }

        try {
            ScheduleGroupLookupResponse body = restClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/api/v1/get_by_group_name/")
                    .queryParam("group_name", groupName.trim())
                    .build())
                .contentType(MediaType.APPLICATION_JSON)
                .body("")
                .retrieve()
                .body(ScheduleGroupLookupResponse.class);

            if (body == null || body.group() == null || isBlank(body.group().guid())) {
                return Optional.empty();
            }
            return Optional.of(body);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<ScheduleWeekApiResponse> fetchGroupWeek(
        String branchGuid,
        String groupGuid,
        LocalDate anchorDate
    ) {
        if (isBlank(branchGuid) || isBlank(groupGuid) || anchorDate == null) {
            return Optional.empty();
        }

        String date = anchorDate.format(API_DATE);

        try {
            ScheduleWeekApiResponse body = restClient.get()
                .uri(
                    "/api/v1/get_schedule/group/{branch}/{group}/{date}",
                    branchGuid.trim(),
                    groupGuid.trim(),
                    date
                )
                .retrieve()
                .body(ScheduleWeekApiResponse.class);

            if (body == null || body.schedule() == null) {
                return Optional.empty();
            }
            return Optional.of(body);
        } catch (HttpClientErrorException e) {
            return Optional.empty();
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
