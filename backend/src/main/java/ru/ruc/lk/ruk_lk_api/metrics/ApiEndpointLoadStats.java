package ru.ruc.lk.ruk_lk_api.metrics;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "api_endpoint_load_stats")
public class ApiEndpointLoadStats {

    @Id
    @Column(length = 320)
    private String id;

    @Column(nullable = false, length = 16)
    private String method;

    @Column(nullable = false, length = 300)
    private String path;

    @Column(nullable = false)
    private long completedTotal;

    @Column(nullable = false)
    private long errors4xx;

    @Column(nullable = false)
    private long errors5xx;

    @Column(nullable = false)
    private long sumDurationMs;

    @Column(nullable = false)
    private long minDurationMs = Long.MAX_VALUE;

    @Column(nullable = false)
    private long maxDurationMs;

    /** Пик одновременных запросов. */
    @Column(nullable = false)
    private int maxInFlight;

    /** Мин. зафиксированный in-flight (>0). */
    @Column(nullable = false)
    private int minInFlight = Integer.MAX_VALUE;

    @Column(nullable = false)
    private long sumInFlightSamples;

    @Column(nullable = false)
    private long inFlightSampleCount;

    /** Пик RPM. */
    @Column(nullable = false)
    private double maxRpm;

    /** Мин. зафиксированный RPM (>0). */
    @Column(nullable = false)
    private double minRpm = Double.MAX_VALUE;

    @Column(nullable = false)
    private double sumRpmSamples;

    @Column(nullable = false)
    private long rpmSampleCount;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ApiEndpointLoadStats() {}

    public ApiEndpointLoadStats(String id, String method, String path) {
        this.id = id;
        this.method = method;
        this.path = path;
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public long getCompletedTotal() {
        return completedTotal;
    }

    public void setCompletedTotal(long completedTotal) {
        this.completedTotal = completedTotal;
    }

    public long getErrors4xx() {
        return errors4xx;
    }

    public void setErrors4xx(long errors4xx) {
        this.errors4xx = errors4xx;
    }

    public long getErrors5xx() {
        return errors5xx;
    }

    public void setErrors5xx(long errors5xx) {
        this.errors5xx = errors5xx;
    }

    public long getSumDurationMs() {
        return sumDurationMs;
    }

    public void setSumDurationMs(long sumDurationMs) {
        this.sumDurationMs = sumDurationMs;
    }

    public long getMinDurationMs() {
        return minDurationMs;
    }

    public void setMinDurationMs(long minDurationMs) {
        this.minDurationMs = minDurationMs;
    }

    public long getMaxDurationMs() {
        return maxDurationMs;
    }

    public void setMaxDurationMs(long maxDurationMs) {
        this.maxDurationMs = maxDurationMs;
    }

    public int getMaxInFlight() {
        return maxInFlight;
    }

    public void setMaxInFlight(int maxInFlight) {
        this.maxInFlight = maxInFlight;
    }

    public int getMinInFlight() {
        return minInFlight;
    }

    public void setMinInFlight(int minInFlight) {
        this.minInFlight = minInFlight;
    }

    public long getSumInFlightSamples() {
        return sumInFlightSamples;
    }

    public void setSumInFlightSamples(long sumInFlightSamples) {
        this.sumInFlightSamples = sumInFlightSamples;
    }

    public long getInFlightSampleCount() {
        return inFlightSampleCount;
    }

    public void setInFlightSampleCount(long inFlightSampleCount) {
        this.inFlightSampleCount = inFlightSampleCount;
    }

    public double getMaxRpm() {
        return maxRpm;
    }

    public void setMaxRpm(double maxRpm) {
        this.maxRpm = maxRpm;
    }

    public double getMinRpm() {
        return minRpm;
    }

    public void setMinRpm(double minRpm) {
        this.minRpm = minRpm;
    }

    public double getSumRpmSamples() {
        return sumRpmSamples;
    }

    public void setSumRpmSamples(double sumRpmSamples) {
        this.sumRpmSamples = sumRpmSamples;
    }

    public long getRpmSampleCount() {
        return rpmSampleCount;
    }

    public void setRpmSampleCount(long rpmSampleCount) {
        this.rpmSampleCount = rpmSampleCount;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
