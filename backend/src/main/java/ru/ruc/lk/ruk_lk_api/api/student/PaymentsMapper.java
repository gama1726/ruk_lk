package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentContractResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentScheduleItemResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentTotalsResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPaymentsResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentContract;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentScheduleItem;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentTotals;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPaymentsResponse;

final class PaymentsMapper {

    private PaymentsMapper() {}

    static StudentPaymentsResponse toResponse(OneCPaymentsResponse source, LocalDate asOf) {
        List<OneCPaymentScheduleItem> raw =
            source.schedule() == null ? List.of() : source.schedule();

        List<StudentPaymentScheduleItemResponse> schedule = new ArrayList<>(raw.size());
        for (OneCPaymentScheduleItem item : raw) {
            if (item == null) {
                continue;
            }
            schedule.add(toScheduleItem(item, asOf));
        }

        OneCPaymentContract firstContract =
            source.contracts() != null && !source.contracts().isEmpty()
                ? source.contracts().get(0)
                : null;

        StudentPaymentContractResponse contract = firstContract == null
            ? null
            : new StudentPaymentContractResponse(
                blank(firstContract.number()),
                blank(firstContract.date()),
                blank(firstContract.displayDate()),
                blank(firstContract.presentation()),
                blank(firstContract.objectType())
            );

        StudentPaymentTotalsResponse totals = toTotals(source.totals());
        NextPayment next = resolveNext(schedule, asOf, totals);
        String status = resolveOverallStatus(totals, schedule);

        return new StudentPaymentsResponse(
            blank(source.studentId()),
            blank(source.studentFullName()),
            source.paymentFound() || !schedule.isEmpty(),
            blank(source.asOfDate()),
            status,
            contract,
            totals,
            next.date(),
            next.displayDate(),
            next.amount(),
            List.copyOf(schedule)
        );
    }

    private static StudentPaymentTotalsResponse toTotals(OneCPaymentTotals t) {
        if (t == null) {
            return new StudentPaymentTotalsResponse(0, 0, 0, 0, 0, 0, 0, 0);
        }
        // Шкала «внесено» — доля от полной суммы графика за всё обучение.
        int paidPercent = 0;
        if (t.scheduled() > 0) {
            paidPercent = (int) Math.round(100.0 * t.paid() / t.scheduled());
            paidPercent = Math.max(0, Math.min(100, paidPercent));
        }
        return new StudentPaymentTotalsResponse(
            t.scheduled(),
            t.scheduledDue(),
            t.paid(),
            t.debt(),
            t.advance(),
            t.penalty(),
            t.totalToPay(),
            paidPercent
        );
    }

    private static StudentPaymentScheduleItemResponse toScheduleItem(
        OneCPaymentScheduleItem item,
        LocalDate asOf
    ) {
        String status = resolveItemStatus(item, asOf);
        String title = buildTitle(item);
        return new StudentPaymentScheduleItemResponse(
            item.number() + "|" + blank(item.date()),
            item.number(),
            title,
            blank(item.studyYear()),
            blank(item.course()),
            blank(item.date()),
            blank(item.displayDate()),
            item.scheduled(),
            item.paid(),
            item.debt(),
            item.penalty(),
            item.total(),
            item.debtDays(),
            status
        );
    }

    private static String buildTitle(OneCPaymentScheduleItem item) {
        String year = blank(item.studyYear());
        String course = blank(item.course());
        if (!year.isEmpty() && !course.isEmpty()) {
            return year + " · " + course + " курс";
        }
        if (!year.isEmpty()) {
            return year;
        }
        if (!course.isEmpty()) {
            return course + " курс";
        }
        return "Платёж №" + item.number();
    }

    private static String resolveItemStatus(OneCPaymentScheduleItem item, LocalDate asOf) {
        if (item.debt() > 0.009 || item.total() > 0.009) {
            return "overdue";
        }
        if (item.scheduled() > 0 && item.paid() + 0.009 >= item.scheduled()) {
            return "paid";
        }
        LocalDate due = parseDate(item.date());
        if (due != null && due.isAfter(asOf) && item.paid() < item.scheduled()) {
            return "pending";
        }
        if (item.paid() < item.scheduled()) {
            return "pending";
        }
        return "paid";
    }

    private static String resolveOverallStatus(
        StudentPaymentTotalsResponse totals,
        List<StudentPaymentScheduleItemResponse> schedule
    ) {
        if (totals.debt() > 0.009 || totals.totalToPay() > 0.009) {
            return "overdue";
        }
        boolean hasPending = schedule.stream().anyMatch(s -> "pending".equals(s.status()));
        if (hasPending) {
            return "due";
        }
        return "ok";
    }

    private static NextPayment resolveNext(
        List<StudentPaymentScheduleItemResponse> schedule,
        LocalDate asOf,
        StudentPaymentTotalsResponse totals
    ) {
        for (StudentPaymentScheduleItemResponse item : schedule) {
            if ("overdue".equals(item.status())) {
                double amount = item.total() > 0 ? item.total() : item.debt();
                return new NextPayment(item.date(), item.displayDate(), amount);
            }
        }
        for (StudentPaymentScheduleItemResponse item : schedule) {
            if (!"pending".equals(item.status())) {
                continue;
            }
            LocalDate due = parseDate(item.date());
            if (due == null || !due.isBefore(asOf)) {
                double amount = Math.max(0, item.scheduled() - item.paid());
                return new NextPayment(item.date(), item.displayDate(), amount);
            }
        }
        if (totals.totalToPay() > 0) {
            return new NextPayment("", "", totals.totalToPay());
        }
        return new NextPayment("", "", 0);
    }

    private static LocalDate parseDate(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(iso.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private record NextPayment(String date, String displayDate, double amount) {}
}
