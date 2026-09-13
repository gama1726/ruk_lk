package ru.ruc.lk.ruk_lk_api.api.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentAttendanceResponse;

class AttendanceCacheTest {

    private static final LocalDate FROM = LocalDate.of(2026, 9, 7);
    private static final LocalDate TO = LocalDate.of(2026, 9, 13);

    @Test
    void returnsCachedResponseWithoutReloading() {
        AttendanceCache cache = new AttendanceCache();
        StudentAttendanceResponse first = emptyResponse();
        AtomicInteger loads = new AtomicInteger();

        StudentAttendanceResponse loaded = cache.getOrLoad("111717", FROM, TO, "perco", () -> {
            loads.incrementAndGet();
            return first;
        });
        StudentAttendanceResponse cached = cache.getOrLoad("111717", FROM, TO, "perco", () -> {
            loads.incrementAndGet();
            return emptyResponse();
        });

        assertSame(first, loaded);
        assertSame(first, cached);
        assertEquals(1, loads.get());
    }

    @Test
    void coalescesConcurrentLoads() throws Exception {
        AttendanceCache cache = new AttendanceCache();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger loads = new AtomicInteger();
        StudentAttendanceResponse response = emptyResponse();

        Thread first = new Thread(() -> cache.getOrLoad("111717", FROM, TO, "zkbio", () -> {
            loads.incrementAndGet();
            started.countDown();
            try {
                release.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return response;
        }));
        first.start();
        started.await();

        Thread second = new Thread(() -> cache.getOrLoad("111717", FROM, TO, "zkbio", () -> {
            loads.incrementAndGet();
            return emptyResponse();
        }));
        second.start();
        release.countDown();
        first.join();
        second.join();

        assertEquals(1, loads.get());
    }

    @Test
    void coolsDownSameRangeAfterFailure() {
        AttendanceCache cache = new AttendanceCache();

        ResponseStatusException first = assertThrows(
            ResponseStatusException.class,
            () -> cache.getOrLoad("111717", FROM, TO, "zkbio", () -> {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "СКUD недоступен");
            })
        );
        assertEquals(HttpStatus.BAD_GATEWAY, first.getStatusCode());

        ResponseStatusException retry = assertThrows(
            ResponseStatusException.class,
            () -> cache.getOrLoad("111717", FROM, TO, "zkbio", () -> emptyResponse())
        );
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, retry.getStatusCode());
    }

    private static StudentAttendanceResponse emptyResponse() {
        return new StudentAttendanceResponse(
            "perco",
            List.of(),
            new StudentAttendanceResponse.StudentAttendanceSummaryResponse(0, 0, 0, 0, null, null)
        );
    }
}
