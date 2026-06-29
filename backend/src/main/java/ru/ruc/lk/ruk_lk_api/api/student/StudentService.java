package ru.ruc.lk.ruk_lk_api.api.student;



import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.api.student.dto.RecordBookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import org.springframework.http.HttpStatus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCGradebookResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;



@Service

public class StudentService {



    private static final String SESSION_KEY = "STUDENT";

    private final OneCClient onecClient;



    public StudentService(OneCClient onecClient) {

        this.onecClient = onecClient;

    }



    public StudentProfileResponse getProfile(HttpSession session) {

        StudentSession student = requireStudent(session);



        OneCProfileResponse profile = onecClient

            .fetchProfile(student.studentId())

            .orElseThrow(() -> new ResponseStatusException(

                HttpStatus.NOT_FOUND,

                "Профиль студента не найден"

            ));



        String zachetka = profile.zachetka() != null && !profile.zachetka().isBlank()

            ? profile.zachetka().trim()

            : profile.studentId();



        return new StudentProfileResponse(

            blankToEmpty(profile.fullName()),

            blankToEmpty(zachetka),

            blankToEmpty(profile.email()),

            blankToEmpty(profile.phone()),

            blankToEmpty(profile.gender()),

            blankToEmpty(profile.birthDate()),

            blankToEmpty(profile.fundingType()),

            blankToEmpty(profile.status()),

            blankToEmpty(profile.faculty()),

            blankToEmpty(profile.department()),

            formatDirection(profile.direction(), profile.specialization()),

            blankToEmpty(profile.level()),

            blankToEmpty(profile.educationForm()),

            blankToEmpty(profile.group()),

            blankToEmpty(profile.course())

        );

    }

    public RecordBookResponse getRecordBook(HttpSession session) {
        StudentSession student = requireStudent(session);

        OneCGradebookResponse gradebook = onecClient
            .fetchGradebook(student.studentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Зачётная книжка не найдена"
            ));

        return GradebookMapper.toResponse(gradebook);
    }

    private static String formatDirection(String direction, String specialization) {

        String d = direction == null ? "" : direction.trim();

        String s = specialization == null ? "" : specialization.trim();

        if (!d.isEmpty() && !s.isEmpty()) {

            return d + " (" + s + ")";

        }

        if (!d.isEmpty()) {

            return d;

        }

        return s;

    }



    private static String blankToEmpty(String value) {

        return value == null || value.isBlank() ? "" : value.trim();

    }



    private StudentSession requireStudent(HttpSession session) {

        Object raw = session.getAttribute(SESSION_KEY);

        if (!(raw instanceof StudentSession student)) {

            throw new ResponseStatusException(

                HttpStatus.UNAUTHORIZED,

                "Сначала войдите в систему"

            );

        }

        return student;

    }

}

