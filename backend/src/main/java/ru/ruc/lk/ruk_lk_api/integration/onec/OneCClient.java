package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

public interface OneCClient {
        /**
 * @param studentId номер зачётки в 1С, например 172194
 * @param password пароль из 1С
 * @return данные студента или пусто, если не найден / неверный пароль
 */
    
    Optional<MeResponse> login(String studentId, String password);
    Optional<OneCProfileResponse> fetchProfile(String studentId);
    Optional<OneCGradebookResponse> fetchGradebook(String studentId);
}
