package ru.ruc.lk.ruk_lk_api.api.student;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentLibraryResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.StudentLibraryResponse.LibraryBookDto;
import ru.ruc.lk.ruk_lk_api.integration.megaapi.MegaBookItem;
import ru.ruc.lk.ruk_lk_api.integration.megaapi.MegaReaderRecord;

final class LibraryMapper {

    private static final DateTimeFormatter MEGA_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DISPLAY = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru"));

    private LibraryMapper() {}

    static StudentLibraryResponse unavailable(String studentId) {
        return new StudentLibraryResponse(
            blank(studentId),
            "unavailable",
            "",
            List.of(),
            List.of(),
            List.of()
        );
    }

    static StudentLibraryResponse toResponse(
        String studentId,
        MegaReaderRecord reader,
        List<MegaBookItem> onHand,
        List<MegaBookItem> debts,
        List<MegaBookItem> orders
    ) {
        String holder = reader != null && reader.name() != null ? reader.name().trim() : "";
        String rdrId = reader != null && reader.rdrId() != null && !reader.rdrId().isBlank()
            ? reader.rdrId().trim()
            : blank(studentId);
        String status = reader != null ? "active" : "missing";

        LocalDate today = LocalDate.now();
        return new StudentLibraryResponse(
            rdrId,
            status,
            holder,
            mapBooks(onHand, "on-hand", today),
            mapBooks(debts, "overdue", today),
            mapBooks(orders, "ordered", today)
        );
    }

    private static List<LibraryBookDto> mapBooks(List<MegaBookItem> items, String defaultStatus, LocalDate today) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        List<LibraryBookDto> result = new ArrayList<>(items.size());
        int i = 0;
        for (MegaBookItem item : items) {
            if (item == null) {
                continue;
            }
            String biblio = blank(item.biblio());
            String[] titleAuthor = splitBiblio(biblio);
            LocalDate taken = parseMegaDate(item.getdate());
            LocalDate due = parseMegaDate(item.retdate());
            String status = defaultStatus;
            if ("on-hand".equals(defaultStatus) && due != null && due.isBefore(today)) {
                status = "overdue";
            }
            String id = blank(item.docId());
            if (id.isEmpty()) {
                id = defaultStatus + "-" + i;
            }
            result.add(new LibraryBookDto(
                id,
                titleAuthor[0],
                titleAuthor[1],
                biblio,
                taken != null ? taken.format(ISO) : "",
                due != null ? due.format(ISO) : "",
                formatDisplay(taken, item.getdate()),
                formatDisplay(due, item.retdate()),
                blank(item.bookpoint()),
                status
            ));
            i++;
        }
        return result;
    }

    /**
     * «Автор. Заглавие…» → title / author; иначе всё в title.
     */
    static String[] splitBiblio(String biblio) {
        if (biblio == null || biblio.isBlank()) {
            return new String[] {"", ""};
        }
        String text = biblio.trim();
        int dot = text.indexOf('.');
        if (dot > 0 && dot < 120 && dot < text.length() - 1) {
            String author = text.substring(0, dot).trim();
            String title = text.substring(dot + 1).trim();
            if (!author.isEmpty() && !title.isEmpty()) {
                return new String[] {title, author};
            }
        }
        return new String[] {text, ""};
    }

    private static LocalDate parseMegaDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        try {
            return LocalDate.parse(value, MEGA_DATE);
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        try {
            return LocalDate.parse(value, ISO);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private static String formatDisplay(LocalDate date, String raw) {
        if (date != null) {
            return DISPLAY.format(date);
        }
        return blank(raw);
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }
}
