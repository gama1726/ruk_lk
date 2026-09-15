package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminLoginRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminMeResponse;

@Service
@EnableConfigurationProperties(LkAdminProperties.class)
public class LkAdminAuthService {

    public static final String SESSION_KEY = "LK_ADMIN";

    private final LkAdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public LkAdminAuthService(LkAdminUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public LkAdminMeResponse login(HttpServletRequest request, LkAdminLoginRequest body) {
        if (body == null || blank(body.username()) || blank(body.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите логин и пароль");
        }
        LkAdminUser user = repository.findByUsernameIgnoreCase(body.username().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Учётка отключена");
        }
        if (!passwordEncoder.matches(body.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        Set<LkAdminSection> sections = effectiveSections(user);
        HttpSession session = request.getSession(true);
        session.setAttribute(
            SESSION_KEY,
            new LkAdminSession(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.isSuperAdmin(),
                sections
            )
        );
        return toMe(user, sections);
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
    }

    public LkAdminMeResponse me(HttpSession session) {
        LkAdminSession admin = require(session);
        LkAdminUser user = repository.findById(admin.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админ-панель ЛК"));
        if (!user.isActive()) {
            logout(session);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Учётка отключена");
        }
        Set<LkAdminSection> sections = effectiveSections(user);
        session.setAttribute(
            SESSION_KEY,
            new LkAdminSession(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.isSuperAdmin(),
                sections
            )
        );
        return toMe(user, sections);
    }

    public static boolean isLoggedIn(HttpSession session) {
        return session != null && session.getAttribute(SESSION_KEY) instanceof LkAdminSession;
    }

    public static LkAdminSession require(HttpSession session) {
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админ-панель ЛК");
        }
        Object raw = session.getAttribute(SESSION_KEY);
        if (raw instanceof LkAdminSession admin) {
            return admin;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Войдите в админ-панель ЛК");
    }

    public static void requireSection(HttpSession session, LkAdminSection section) {
        LkAdminSession admin = require(session);
        if (!admin.hasSection(section)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к этому разделу");
        }
    }

    static Set<LkAdminSection> effectiveSections(LkAdminUser user) {
        if (user.isSuperAdmin()) {
            return EnumSet.allOf(LkAdminSection.class);
        }
        if (user.getSections() == null || user.getSections().isEmpty()) {
            return EnumSet.noneOf(LkAdminSection.class);
        }
        return EnumSet.copyOf(user.getSections());
    }

    static Set<LkAdminSection> parseSections(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return EnumSet.noneOf(LkAdminSection.class);
        }
        Set<LkAdminSection> result = new LinkedHashSet<>();
        for (String item : raw) {
            if (item == null || item.isBlank()) {
                continue;
            }
            try {
                result.add(LkAdminSection.valueOf(item.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Неизвестный раздел: " + item + ". Доступны: " + Arrays.toString(LkAdminSection.values())
                );
            }
        }
        return result.isEmpty() ? EnumSet.noneOf(LkAdminSection.class) : EnumSet.copyOf(result);
    }

    static LkAdminMeResponse toMe(LkAdminUser user, Set<LkAdminSection> sections) {
        return new LkAdminMeResponse(
            user.getId().toString(),
            user.getUsername(),
            user.getFullName(),
            user.isSuperAdmin(),
            sections.stream().map(Enum::name).sorted().collect(Collectors.toList())
        );
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
