package ru.ruc.lk.ruk_lk_api.api.auth;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCClient;
import ru.ruc.lk.ruk_lk_api.api.auth.dto.MeResponse;

@Service
public class AuthService {
    private static final String SESSION_KEY = "STUDENT";//ключ для сессии

    private final OneCClient onecClient;//HttpOneCClient

    public AuthService(OneCClient onecClient) {
        this.onecClient = onecClient;
    }
    public MeResponse login(String studentId, String password, HttpSession session){
           // звонок в 1С; пусто = неверный логин/пароль
      MeResponse me = onecClient
      .login(studentId, password)
      .orElseThrow(() -> 
      new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Неверный номер зачётки или пароль"
        )
      );
      StudentSession student = new StudentSession(
        me.studentId(),
        me.fullName(),
        me.programs()
      );
    session.setAttribute(SESSION_KEY, student);
    return me;
}
  /**
   * Кто сейчас залогинен (для GET /api/me).
   */
  public Optional<MeResponse> currentUser(HttpSession session){
    Object raw = session.getAttribute(SESSION_KEY);
    if(!(raw instanceof StudentSession student)){
        return Optional.empty();// не вошёл
  }

  return Optional.of(new MeResponse(
    student.studentId(),
    student.fullName(),
    student.programs()
    ));
  }
      /**
   * Выход: сессия уничтожается.
   */
  public void logout(HttpSession session){
    session.invalidate();
   } 
  }