package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Optional;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

/**
 * PDF «Уведомление об отсутствии». Бланк выбирается по кампусу и уровню (СПО/ВО).
 * Пока есть только Казань СПО и Казань ВО; иначе {@link #generate} пустой.
 */
@Component
public class AbsenceNoticePdfGenerator {

    private final BaseFont baseRegular;
    private final BaseFont baseBold;

    public AbsenceNoticePdfGenerator() {
        this.baseRegular = loadFont("fonts/DejaVuSans.ttf");
        this.baseBold = loadFont("fonts/DejaVuSans-Bold.ttf");
    }

    /** Есть ли бланк для пары кампус × трек. */
    public boolean hasTemplate(LkAbsenceReportCampus campus, EducationTrack track) {
        return AbsenceNoticeTemplate.resolve(campus, track).isPresent();
    }

    public Optional<byte[]> generate(
        LkAbsenceReportCampus campus,
        EducationTrack track,
        String studentFullName,
        String absenceDateRu,
        String violationsDetail
    ) {
        return AbsenceNoticeTemplate.resolve(campus, track)
            .map(template -> generate(template, studentFullName, absenceDateRu, violationsDetail));
    }

    public byte[] generate(AbsenceNoticeTemplate template, String studentFullName, String absenceDateRu) {
        return generate(template, studentFullName, absenceDateRu, null);
    }

    public byte[] generate(
        AbsenceNoticeTemplate template,
        String studentFullName,
        String absenceDateRu,
        String violationsDetail
    ) {
        if (template == null) {
            throw new IllegalArgumentException("Шаблон уведомления не задан");
        }
        return switch (template) {
            case KAZAN_SPO -> generateKazanSpo(studentFullName, absenceDateRu, violationsDetail);
            case KAZAN_HE -> generateKazanHe(studentFullName, absenceDateRu, violationsDetail);
        };
    }

    private byte[] generateKazanSpo(String studentFullName, String absenceDateRu, String violationsDetail) {
        String fio = blankToDash(studentFullName);
        String date = blankToDash(absenceDateRu);
        String violations = normalizeViolations(violationsDetail);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = openDocument(out);
            Font header = font(baseRegular, 9);
            Font title = font(baseBold, 12);
            Font body = font(baseRegular, 11);
            Font bodyBold = font(baseBold, 11);
            Font small = font(baseRegular, 10);

            addKazanHeader(document, header, small, date);
            addCentered(document, "ФАКУЛЬТЕТ СРЕДНЕГО ПРОФЕССИОНАЛЬНОГО ОБРАЗОВАНИЯ", bodyBold);
            addNoticeTitle(document, title, bodyBold);

            Paragraph greeting = new Paragraph("Уважаемый заказчик!", body);
            greeting.setSpacingBefore(14);
            greeting.setSpacingAfter(8);
            document.add(greeting);

            addMainBody(document, body, fio, date, violations, bodyBold);

            document.add(new Paragraph("Контактные лица:", bodyBold));
            document.add(new Paragraph(
                "Гатина Альбина Рифкатовна, декан факультета среднего профессионального образования",
                small
            ));
            document.add(new Paragraph("Телефон: 8 917 286 13 26", small));
            Paragraph gap = new Paragraph(" ", small);
            gap.setSpacingBefore(4);
            document.add(gap);
            document.add(new Paragraph(
                "Петлицкая Елена Алексеевна, зам. декана факультета среднего профессионального образования",
                small
            ));
            document.add(new Paragraph("Телефон: 8 960 035 73 33", small));

            Paragraph signLabel = new Paragraph("Декан факультета\nсреднего профессионального образования", small);
            signLabel.setSpacingBefore(28);
            document.add(signLabel);

            Paragraph signName = new Paragraph("А.Р. Гатина", small);
            signName.setAlignment(Element.ALIGN_RIGHT);
            signName.setSpacingBefore(8);
            document.add(signName);

            document.close();
            return out.toByteArray();
        } catch (DocumentException | IOException e) {
            throw wrap(e);
        }
    }

    private byte[] generateKazanHe(String studentFullName, String absenceDateRu, String violationsDetail) {
        String fio = blankToDash(studentFullName);
        String date = blankToDash(absenceDateRu);
        String violations = normalizeViolations(violationsDetail);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = openDocument(out);
            Font header = font(baseRegular, 9);
            Font title = font(baseBold, 12);
            Font body = font(baseRegular, 11);
            Font bodyBold = font(baseBold, 11);
            Font small = font(baseRegular, 10);

            addKazanHeader(document, header, small, date);
            addCentered(document, "ФАКУЛЬТЕТ ВЫСШЕГО ОБРАЗОВАНИЯ", bodyBold);
            addNoticeTitle(document, title, bodyBold);

            Paragraph greeting = new Paragraph("Уважаемый (заказчик)!", body);
            greeting.setSpacingBefore(14);
            greeting.setSpacingAfter(8);
            document.add(greeting);

            addMainBody(document, body, fio, date, violations, bodyBold);

            document.add(new Paragraph("Контактные лица:", bodyBold));
            document.add(new Paragraph(
                "Фаррахова Лилия Ильдусовна, декан факультета высшего образования",
                small
            ));
            document.add(new Paragraph("Телефон: 8 927 249 20-45", small));
            document.add(new Paragraph("Адрес электронной почты: l.i.farrahova@ruc.su", small));

            Paragraph signLabel = new Paragraph("Декан факультета\nвысшего образования", small);
            signLabel.setSpacingBefore(28);
            document.add(signLabel);

            Paragraph signName = new Paragraph("Л.И. Фаррахова", small);
            signName.setAlignment(Element.ALIGN_RIGHT);
            signName.setSpacingBefore(8);
            document.add(signName);

            document.close();
            return out.toByteArray();
        } catch (DocumentException | IOException e) {
            throw wrap(e);
        }
    }

    private static Document openDocument(ByteArrayOutputStream out) throws DocumentException {
        Document document = new Document(PageSize.A4, 56, 56, 48, 48);
        PdfWriter.getInstance(document, out);
        document.open();
        return document;
    }

    private static void addKazanHeader(Document document, Font header, Font small, String date)
        throws DocumentException {
        addCentered(document, "Автономная некоммерческая образовательная организация высшего образования", header);
        addCentered(document, "Центросоюза Российской Федерации «Российский университет кооперации»", header);
        addCentered(document, "Казанский кооперативный институт (филиал)", header);
        addCentered(document, "Николая Ершова ул., д.58, г. Казань, Республика Татарстан, 420081", header);
        addCentered(document, "Тел. 8(843) 210-30-28", header);

        Paragraph dateLine = new Paragraph("от " + date, small);
        dateLine.setSpacingBefore(10);
        dateLine.setSpacingAfter(12);
        document.add(dateLine);
    }

    private static void addNoticeTitle(Document document, Font title, Font bodyBold) throws DocumentException {
        Paragraph noticeTitle = new Paragraph("УВЕДОМЛЕНИЕ", title);
        noticeTitle.setAlignment(Element.ALIGN_CENTER);
        noticeTitle.setSpacingBefore(8);
        document.add(noticeTitle);
        addCentered(document, "об отсутствии обучающегося на учебных занятиях", bodyBold);
    }

    private static void addMainBody(
        Document document,
        Font body,
        String fio,
        String date,
        String violations,
        Font bodyBold
    ) throws DocumentException {
        String mainText =
            "В соответствии с п. 2.4 Договора на оказание образовательных услуг по образовательным "
                + "программам среднего профессионального образования и высшего образования "
                + "информируем Вас о нарушении обучающимся " + fio
                + " положений п. 5.1 Договора, в виде непосещения учебных занятий " + date
                + ", предусмотренных учебным планом образовательной программы.";
        Paragraph main = new Paragraph(mainText, body);
        main.setAlignment(Element.ALIGN_JUSTIFIED);
        main.setSpacingAfter(14);
        document.add(main);

        if (!violations.isBlank()) {
            Paragraph vTitle = new Paragraph("Сведения о нарушениях:", bodyBold);
            vTitle.setSpacingAfter(4);
            document.add(vTitle);
            Paragraph vBody = new Paragraph(violations, body);
            vBody.setSpacingAfter(14);
            document.add(vBody);
        }
    }

    /** Для PDF/сообщения: full → «неявка на все пары», иначе список без «Вовремя». */
    public static String resolveViolationsText(String kind, String absenceRange) {
        if (kind != null && "full".equalsIgnoreCase(kind.trim())) {
            return "неявка на все пары";
        }
        return normalizeViolations(absenceRange);
    }

    private static String normalizeViolations(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.trim()
            .lines()
            .map(String::trim)
            .filter(line -> !line.isEmpty())
            .filter(line -> !line.contains("Вовремя"))
            .reduce((a, b) -> a + "\n" + b)
            .orElse("");
    }

    private static void addCentered(Document document, String text, Font font) throws DocumentException {
        Paragraph p = new Paragraph(new Phrase(text, font));
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(1);
        document.add(p);
    }

    private static Font font(BaseFont base, float size) {
        return new Font(base, size);
    }

    private static BaseFont loadFont(String classpath) {
        try (InputStream in = new ClassPathResource(classpath).getInputStream()) {
            byte[] bytes = in.readAllBytes();
            return BaseFont.createFont(
                classpath,
                BaseFont.IDENTITY_H,
                BaseFont.EMBEDDED,
                false,
                bytes,
                null
            );
        } catch (IOException | DocumentException e) {
            throw new IllegalStateException("Не удалось загрузить шрифт " + classpath, e);
        }
    }

    private static String blankToDash(String value) {
        return value == null || value.isBlank() ? "—" : value.trim();
    }

    private static UncheckedIOException wrap(Exception e) {
        return new UncheckedIOException(
            "Не удалось сформировать PDF уведомления",
            e instanceof IOException io ? io : new IOException(e)
        );
    }
}
