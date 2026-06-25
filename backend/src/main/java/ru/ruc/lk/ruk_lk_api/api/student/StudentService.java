package ru.ruc.lk.ruk_lk_api.api.student;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.StudentProfileResponse;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.StudentSession;
import org.springframework.http.HttpStatus;
import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

@Service
public class StudentService {

    private static final String SESSION_KEY = "STUDENT";
    private final OneCClient onecClient;

    public StudentService(OneCClient onecClient){
        this.onecClient = onecClient;
    }

    public StudentProfileResponse getProfile(HttpSession session){
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
            profile.fullName(),
            zachetka,
            profile.email(),
            profile.phone(),
            profile.gender(),
            profile.birthDate(),
            "",
            profile.status()
        );
    }
    private StudentSession requireStudent(HttpSession session){
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