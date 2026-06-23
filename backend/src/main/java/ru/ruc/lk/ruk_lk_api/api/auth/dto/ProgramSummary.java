package ru.ruc.lk.ruk_lk_api.api.auth.dto;
public record ProgramSummary(
    String id, //ключ программы во фронте

    String recordBookNumber, //номер зачётки
    String level, //Бакалавриат, Магистратура, Специалитет,Аспирантура
    String direction, //направление плдготовки
    String group //учебная группа
){}