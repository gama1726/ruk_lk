package ru.ruc.lk.ruk_lk_api.integration.onec;

import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;

public interface OneCClient {
        /**
 * @param recordBookNumber номер зачётки, например 123456
 * @param password пароль из 1С
 * @return данные студента или пусто, если не найден / неверный пароль
 */
    
    Optional<MeResponse> login(String recordBookNumber, String password);
}
