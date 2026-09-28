package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import ru.ruc.lk.ruk_lk_api.integration.email.AbsenceNoticeEmailSender;
import ru.ruc.lk.ruk_lk_api.integration.email.EmailSendException;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxBindingService;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxOutboundMessages;
import ru.ruc.lk.ruk_lk_api.integration.max.MaxSendException;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCFamilyResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCParentMember;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.AbsenceReportRowDto;

/**
 * Рассылка PDF-уведомлений после отчёта отсутствующих (только Казань / ZKBio).
 * <ul>
 *   <li>несовершеннолетний → родителям;</li>
 *   <li>совершеннолетний → родителям с полным доступом в ЛК ({@code !servicesBlocked}),
 *       иначе самому студенту;</li>
 *   <li>канал: MAX при привязке, иначе email.</li>
 * </ul>
 */
@Service
public class LkAbsenceNoticeService {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceNoticeService.class);

    private final boolean notifyEnabled;
    private final OneCClient onecClient;
    private final MaxBindingService maxBindingService;
    private final ObjectProvider<MaxOutboundMessages> maxOutbound;
    private final AbsenceNoticeEmailSender emailSender;
    private final AbsenceNoticePdfGenerator pdfGenerator;
    private final LkAbsenceParentNoticeRepository noticeRepository;

    public LkAbsenceNoticeService(
        @Value("${app.absence-report.notify-enabled:true}") boolean notifyEnabled,
        OneCClient onecClient,
        MaxBindingService maxBindingService,
        ObjectProvider<MaxOutboundMessages> maxOutbound,
        AbsenceNoticeEmailSender emailSender,
        AbsenceNoticePdfGenerator pdfGenerator,
        LkAbsenceParentNoticeRepository noticeRepository
    ) {
        this.notifyEnabled = notifyEnabled;
        this.onecClient = onecClient;
        this.maxBindingService = maxBindingService;
        this.maxOutbound = maxOutbound;
        this.emailSender = emailSender;
        this.pdfGenerator = pdfGenerator;
        this.noticeRepository = noticeRepository;
    }

    public void notifyAfterReport(LocalDate reportDate, List<AbsenceReportRowDto> rows) {
        if (!notifyEnabled) {
            log.info("Рассылка уведомлений о непосещаемости отключена (app.absence-report.notify-enabled=false)");
            return;
        }
        if (rows == null || rows.isEmpty()) {
            return;
        }

        int sent = 0;
        int skipped = 0;
        int failed = 0;

        for (AbsenceReportRowDto row : rows) {
            if (row == null || row.studentId() == null || row.studentId().isBlank()) {
                skipped++;
                continue;
            }
            String studentId = row.studentId().trim();
            if (alreadyNotified(reportDate, studentId)) {
                skipped++;
                continue;
            }
            try {
                NotifyOutcome outcome = notifyStudent(reportDate, row);
                if (outcome == NotifyOutcome.SENT) {
                    markNotified(reportDate, studentId);
                    sent++;
                } else if (outcome == NotifyOutcome.NO_RECIPIENTS) {
                    skipped++;
                } else {
                    failed++;
                }
            } catch (RuntimeException e) {
                failed++;
                log.warn(
                    "Не удалось уведомить по отсутствию studentId={}: {}",
                    studentId,
                    e.toString()
                );
            }
        }

        log.info(
            "Рассылка уведомлений о непосещаемости (Казань) за {}: sent={} skipped={} failed={} totalRows={}",
            reportDate,
            sent,
            skipped,
            failed,
            rows.size()
        );
    }

    /**
     * Принудительная отправка по одному студенту (в т.ч. переотправка).
     * При успехе ставит {@code parentNotified=true}.
     */
    public NotifyOutcome notifyOneForced(LocalDate reportDate, String studentId, String fullNameHint) {
        if (studentId == null || studentId.isBlank()) {
            return NotifyOutcome.NO_RECIPIENTS;
        }
        String id = studentId.trim();
        String dateRu = reportDate.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        AbsenceReportRowDto row = new AbsenceReportRowDto(
            dateRu,
            "",
            id,
            fullNameHint == null || fullNameHint.isBlank() ? id : fullNameHint.trim(),
            "",
            "",
            "",
            alreadyNotified(reportDate, id),
            "full"
        );
        NotifyOutcome outcome = notifyStudent(reportDate, row);
        if (outcome == NotifyOutcome.SENT) {
            markNotified(reportDate, id);
        }
        return outcome;
    }

    private NotifyOutcome notifyStudent(LocalDate reportDate, AbsenceReportRowDto row) {
        String studentId = row.studentId().trim();
        String fullName = row.fullName() == null || row.fullName().isBlank() ? studentId : row.fullName().trim();
        String dateRu = row.date() == null || row.date().isBlank()
            ? reportDate.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"))
            : row.date().trim();

        OneCFamilyResponse family = onecClient.checkParent(studentId, null).orElse(null);
        List<NoticeRecipient> recipients = resolveRecipients(studentId, fullName, family);
        if (recipients.isEmpty()) {
            log.info("Нет получателей уведомления о непосещаемости для studentId={}", studentId);
            return NotifyOutcome.NO_RECIPIENTS;
        }

        byte[] pdf = pdfGenerator.generate(fullName, dateRu);
        String fileName = "Uvedomlenie_o_neposeshchaemosti_" + studentId + ".pdf";
        String messageText =
            "Уведомление об отсутствии обучающегося " + fullName
                + " на учебных занятиях " + dateRu
                + ".\nКазанский кооперативный институт (филиал) РУК. Документ во вложении.";

        boolean anySent = false;
        for (NoticeRecipient recipient : recipients) {
            if (deliver(recipient, fullName, dateRu, pdf, fileName, messageText)) {
                anySent = true;
            }
        }
        return anySent ? NotifyOutcome.SENT : NotifyOutcome.DELIVERY_FAILED;
    }

    private List<NoticeRecipient> resolveRecipients(
        String studentId,
        String studentFullName,
        OneCFamilyResponse family
    ) {
        List<NoticeRecipient> result = new ArrayList<>();
        boolean adult = family != null && family.studentAdult();
        List<OneCParentMember> parents = family == null || family.parents() == null
            ? List.of()
            : family.parents();

        if (!adult) {
            for (int i = 0; i < parents.size(); i++) {
                OneCParentMember parent = parents.get(i);
                if (parent == null) {
                    continue;
                }
                toParentRecipient(studentId, i, parent).ifPresent(result::add);
            }
            return result;
        }

        for (int i = 0; i < parents.size(); i++) {
            OneCParentMember parent = parents.get(i);
            if (parent == null || parent.servicesBlocked()) {
                continue;
            }
            toParentRecipient(studentId, i, parent).ifPresent(result::add);
        }
        if (!result.isEmpty()) {
            return result;
        }

        OneCProfileResponse profile = onecClient.fetchProfile(studentId).orElse(null);
        String email = profile == null ? null : profile.email();
        String phone = profile == null ? null : profile.phone();
        String name = profile != null && profile.fullName() != null && !profile.fullName().isBlank()
            ? profile.fullName()
            : studentFullName;
        toSelfRecipient(studentId, name, email, phone).ifPresent(result::add);
        return result;
    }

    private Optional<NoticeRecipient> toParentRecipient(String studentId, int memberIndex, OneCParentMember parent) {
        String bindKey = MaxBindingService.parentBindingKey(studentId, memberIndex);
        Long maxUserId = maxBindingService.findMaxUserId(bindKey).orElse(null);
        String email = blankToNull(parent.email());
        if (maxUserId == null && email == null) {
            return Optional.empty();
        }
        String name = parent.fullName() == null || parent.fullName().isBlank()
            ? "родитель"
            : parent.fullName().trim();
        return Optional.of(new NoticeRecipient(name, email, maxUserId));
    }

    private Optional<NoticeRecipient> toSelfRecipient(
        String studentId,
        String name,
        String email,
        String phone
    ) {
        Long maxUserId = maxBindingService.findMaxUserId(studentId).orElse(null);
        // phone reserved for future phone-match checks; MAX key is raw studentId
        String safeEmail = blankToNull(email);
        if (maxUserId == null && safeEmail == null) {
            log.debug("У студента {} нет MAX и email для уведомления (phonePresent={})", studentId, phone != null);
            return Optional.empty();
        }
        return Optional.of(new NoticeRecipient(
            name == null || name.isBlank() ? "студент" : name.trim(),
            safeEmail,
            maxUserId
        ));
    }

    private boolean deliver(
        NoticeRecipient recipient,
        String studentFullName,
        String dateRu,
        byte[] pdf,
        String fileName,
        String maxText
    ) {
        MaxOutboundMessages outbound = maxOutbound.getIfAvailable();
        if (recipient.maxUserId() != null && outbound != null && outbound.isConfigured()) {
            try {
                outbound.sendFile(recipient.maxUserId(), maxText, pdf, fileName);
                log.info(
                    "Уведомление о непосещаемости отправлено в MAX user_id={} recipient={}",
                    recipient.maxUserId(),
                    recipient.name()
                );
                return true;
            } catch (MaxSendException e) {
                log.warn(
                    "MAX-доставка уведомления не удалась user_id={}: {} — пробуем email",
                    recipient.maxUserId(),
                    e.getMessage()
                );
            }
        } else if (recipient.maxUserId() != null && (outbound == null || !outbound.isConfigured())) {
            log.debug("MAX привязан, но исходящий клиент недоступен — fallback на email");
        }

        if (recipient.email() != null) {
            try {
                emailSender.sendAbsenceNotice(
                    recipient.email(),
                    recipient.name(),
                    studentFullName,
                    dateRu,
                    pdf,
                    fileName
                );
                return true;
            } catch (EmailSendException e) {
                log.warn("Email-доставка уведомления не удалась {}: {}", recipient.email(), e.getMessage());
                return false;
            }
        }
        return false;
    }

    private boolean alreadyNotified(LocalDate date, String studentId) {
        return noticeRepository.findByReportDateAndStudentId(date, studentId)
            .map(LkAbsenceParentNotice::isNotified)
            .orElse(false);
    }

    private void markNotified(LocalDate date, String studentId) {
        LkAbsenceParentNoticeId id = new LkAbsenceParentNoticeId(date, studentId);
        LkAbsenceParentNotice row = noticeRepository.findById(id)
            .orElseGet(() -> new LkAbsenceParentNotice(date, studentId, true));
        row.setNotified(true);
        noticeRepository.save(row);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record NoticeRecipient(String name, String email, Long maxUserId) {}

    public enum NotifyOutcome {
        SENT,
        NO_RECIPIENTS,
        DELIVERY_FAILED
    }
}
