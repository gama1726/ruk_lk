package ru.ruc.lk.ruk_lk_api.integration.perco;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Строка отчёта о проходах {@code GET /api/accessReports/events}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PercoAccessEvent(
    Object id,
    @JsonProperty("tabel_number") String tabelNumber,
    @JsonProperty("tabelNumber") String tabelNumberAlt,
    String fio,
    @JsonProperty("time_label") String timeLabel,
    @JsonProperty("timeLabel") String timeLabelAlt,
    String identifier,
    @JsonProperty("user_id") Object userId,
    @JsonProperty("zone_exit_id") Object zoneExitId,
    @JsonProperty("zone_exit") String zoneExit,
    @JsonProperty("zone_enter_id") Object zoneEnterId,
    @JsonProperty("zone_enter") String zoneEnter,
    @JsonProperty("division_name") String divisionName,
    @JsonProperty("position_name") String positionName
) {
    public String resolvedTabelNumber() {
        if (tabelNumber != null && !tabelNumber.isBlank()) {
            return tabelNumber.trim();
        }
        if (tabelNumberAlt != null && !tabelNumberAlt.isBlank()) {
            return tabelNumberAlt.trim();
        }
        return null;
    }

    public String resolvedTimeLabel() {
        if (timeLabel != null && !timeLabel.isBlank()) {
            return timeLabel.trim();
        }
        if (timeLabelAlt != null && !timeLabelAlt.isBlank()) {
            return timeLabelAlt.trim();
        }
        return null;
    }

    public String resolvedGate() {
        if (zoneEnter != null && !zoneEnter.isBlank()) {
            return zoneEnter.trim();
        }
        if (zoneExit != null && !zoneExit.isBlank()) {
            return zoneExit.trim();
        }
        return null;
    }
}
