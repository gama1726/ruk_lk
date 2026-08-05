package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

public interface OneCClient {
    /**
     * @param studentId номер зачётки в 1С, например 172194
     * @return данные студента или пусто, если не найден
     */
    Optional<MeResponse> login(String studentId);
    Optional<OneCProfileResponse> fetchProfile(String studentId);
    Optional<OneCGradebookResponse> fetchGradebook(String studentId);
    Optional<OneCOrdersResponse> fetchOrders(String studentId);
    Optional<OneCPortfolioResponse> fetchPortfolio(String studentId);
    Optional<OneCPaymentsResponse> fetchPayments(String studentId, java.time.LocalDate asOfDate, boolean showAll);
    Optional<OneCCurriculumResponse> fetchCurriculum(String studentId);

    /**
     * Смена личной почты студента в 1С.
     * @param studentId номер зачётки
     * @param email новый адрес
     */
    Optional<OneCProfileEmailResponse> updateProfileEmail(String studentId, String email);
}
