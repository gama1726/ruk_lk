package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrderItemResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentOrdersResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCOrderItem;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCOrdersResponse;

final class OrdersMapper {

    private OrdersMapper() {}

    static StudentOrdersResponse toResponse(OneCOrdersResponse source) {
        List<OneCOrderItem> raw = source.orders() == null ? List.of() : source.orders();
        List<StudentOrderItemResponse> orders = new ArrayList<>(raw.size());
        for (OneCOrderItem item : raw) {
            if (item == null) {
                continue;
            }
            orders.add(toItem(item));
        }
        orders.sort(Comparator
            .comparing(StudentOrderItemResponse::orderDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(StudentOrderItemResponse::number, Comparator.nullsLast(String::compareTo)));
        return new StudentOrdersResponse(
            blank(source.studentId()),
            blank(source.studentFullName()),
            List.copyOf(orders)
        );
    }

    private static StudentOrderItemResponse toItem(OneCOrderItem item) {
        String number = blank(item.orderNumber());
        String orderDate = blank(item.orderDate());
        return new StudentOrderItemResponse(
            buildId(number, orderDate, blank(item.orderTitle())),
            firstNonBlank(item.orderTitle(), item.orderType()),
            blank(item.orderType()),
            blank(item.orderDocument()),
            number,
            orderDate,
            firstNonBlank(item.displayOrderDate(), orderDate),
            blank(item.startDate()),
            firstNonBlank(item.displayStartDate(), blank(item.startDate()))
        );
    }

    private static String buildId(String number, String orderDate, String title) {
        return number + "|" + orderDate + "|" + title;
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        return blank(fallback);
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
