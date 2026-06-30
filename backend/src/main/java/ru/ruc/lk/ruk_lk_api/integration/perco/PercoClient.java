package ru.ruc.lk.ruk_lk_api.integration.perco;

public interface PercoClient {

    /**
     * Загрузка фото в Perco-Web после одобрения администратором.
     *
     * @param zachetka идентификатор студента в Perco (зачётка / табельный)
     * @param jpeg нормализованное фото
     */
    void uploadPassPhoto(String zachetka, byte[] jpeg) throws PercoException;
}
