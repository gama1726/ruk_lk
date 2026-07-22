package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPortfolioItemResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentPortfolioResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPortfolioItem;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCPortfolioResponse;

final class PortfolioMapper {

    private PortfolioMapper() {}

    static StudentPortfolioResponse toResponse(OneCPortfolioResponse source) {
        List<OneCPortfolioItem> raw = source.items() == null ? List.of() : source.items();
        List<StudentPortfolioItemResponse> items = new ArrayList<>(raw.size());
        int index = 0;
        for (OneCPortfolioItem item : raw) {
            if (item == null) {
                continue;
            }
            items.add(toItem(item, index++));
        }
        items.sort(Comparator
            .comparing(StudentPortfolioItemResponse::date, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(StudentPortfolioItemResponse::title, Comparator.nullsLast(String::compareTo)));

        int count = source.count() > 0 ? source.count() : items.size();
        return new StudentPortfolioResponse(
            blank(source.studentId()),
            blank(source.studentFullName()),
            source.portfolioFound() || !items.isEmpty(),
            count,
            List.copyOf(items)
        );
    }

    private static StudentPortfolioItemResponse toItem(OneCPortfolioItem item, int index) {
        String title = firstNonBlank(item.title(), item.name(), item.description());
        String type = firstNonBlank(item.typeName(), item.type(), item.category());
        String date = firstNonBlank(item.date(), item.startDate());
        String displayDate = firstNonBlank(item.displayDate(), item.displayStartDate(), date);
        String status = firstNonBlank(item.statusName(), item.status());
        String document = firstNonBlank(item.documentName(), item.document());
        String id = firstNonBlank(item.id(), title + "|" + date + "|" + index);

        return new StudentPortfolioItemResponse(
            id,
            title,
            type,
            date,
            displayDate,
            status,
            document,
            blank(item.description())
        );
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
