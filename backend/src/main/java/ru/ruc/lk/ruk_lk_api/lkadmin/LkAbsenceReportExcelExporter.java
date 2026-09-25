package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;

/** Сборка .xlsx отчёта отсутствующих. */
final class LkAbsenceReportExcelExporter {

    private static final String[] HEADERS = {
        "Зачётка",
        "Номер группы",
        "ФИО",
        "Телефон родителя",
        "Время занятий",
        "Посещение по парам",
        "Тип неявки",
        "Уведомление родителям"
    };

    private LkAbsenceReportExcelExporter() {}

    static byte[] build(String reportDate, String campusLabel, int checked, int absent, List<AbsenceReportRowDto> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Отсутствующие");

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 12);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setWrapText(true);

            CellStyle wrapStyle = workbook.createCellStyle();
            wrapStyle.setWrapText(true);

            String title = "Отчёт отсутствующих · " + nullToEmpty(reportDate)
                + (blank(campusLabel) ? "" : " · " + campusLabel.trim())
                + " · проверено " + checked + ", отсутствий " + absent;
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(title);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, HEADERS.length - 1));

            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            if (rows != null) {
                for (AbsenceReportRowDto row : rows) {
                    Row excelRow = sheet.createRow(rowIdx++);
                    write(excelRow, 0, row.studentId(), wrapStyle);
                    write(excelRow, 1, row.group(), wrapStyle);
                    write(excelRow, 2, row.fullName(), wrapStyle);
                    write(excelRow, 3, blank(row.phone()) ? "—" : row.phone(), wrapStyle);
                    write(excelRow, 4, blank(row.scheduleRange()) ? "—" : row.scheduleRange(), wrapStyle);
                    write(excelRow, 5, formatVisitCell(row), wrapStyle);
                    write(excelRow, 6, kindLabel(row.kind()), wrapStyle);
                    write(excelRow, 7, row.parentNotified() ? "отправлено" : "нет", wrapStyle);
                }
            }

            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
                int width = sheet.getColumnWidth(i);
                if (width < 3500) {
                    sheet.setColumnWidth(i, 3500);
                } else if (width > 18000) {
                    sheet.setColumnWidth(i, 18000);
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Не удалось сформировать Excel");
        }
    }

    private static void write(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value == null ? "" : value);
        cell.setCellStyle(style);
    }

    /**
     * Полная неявка — одна фраза; иначе пары с новой строки
     * (в т.ч. старые отчёты с разделителем {@code ; }).
     */
    private static String formatVisitCell(AbsenceReportRowDto row) {
        if (row == null) {
            return "—";
        }
        if ("full".equalsIgnoreCase(row.kind())) {
            return "неявка на все пары";
        }
        String range = row.absenceRange();
        if (blank(range)) {
            return "—";
        }
        StringBuilder out = new StringBuilder();
        for (String part : range.split("\\n|; ")) {
            String line = part == null ? "" : part.trim();
            if (line.isEmpty() || line.contains("— Вовремя")) {
                continue;
            }
            if (out.length() > 0) {
                out.append('\n');
            }
            out.append(line);
        }
        return out.isEmpty() ? "—" : out.toString();
    }

    private static String kindLabel(String kind) {
        if ("full".equalsIgnoreCase(kind)) {
            return "неявка на все пары";
        }
        if ("partial".equalsIgnoreCase(kind)) {
            return "частичная неявка";
        }
        return blank(kind) ? "—" : kind;
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
