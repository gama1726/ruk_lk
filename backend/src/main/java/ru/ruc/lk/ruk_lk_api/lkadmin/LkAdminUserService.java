package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminCreateRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminUpdateRequest;
import ru.ruc.lk.ruk_lk_api.lkadmin.dto.LkAdminUserDto;

@Service
public class LkAdminUserService {

    private final LkAdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public LkAdminUserService(LkAdminUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<LkAdminUserDto> list(HttpSession session) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ADMINS);
        return repository.findAllByOrderByCreatedAtAsc().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public LkAdminUserDto create(HttpSession session, LkAdminCreateRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ADMINS);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        String fullName = requireText(body.fullName(), "Укажите ФИО");
        String username = requireText(body.username(), "Укажите логин").toLowerCase(Locale.ROOT);
        String password = requireText(body.password(), "Укажите пароль");
        if (password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пароль не короче 6 символов");
        }
        if (repository.findByUsernameIgnoreCase(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Логин уже занят");
        }
        Set<LkAdminSection> sections = LkAdminAuthService.parseSections(body.sections());
        if (sections.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Выберите хотя бы один раздел");
        }
        LkAdminUser user = new LkAdminUser(
            UUID.randomUUID(),
            username,
            passwordEncoder.encode(password),
            fullName,
            false,
            sections
        );
        repository.save(user);
        return toDto(user);
    }

    public LkAdminUserDto update(HttpSession session, UUID id, LkAdminUpdateRequest body) {
        LkAdminAuthService.requireSection(session, LkAdminSection.ADMINS);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пустое тело запроса");
        }
        LkAdminUser user = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Админ не найден"));
        LkAdminSession actor = LkAdminAuthService.require(session);
        if (user.isSuperAdmin() && !actor.superAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нельзя менять супер-админа");
        }
        if (body.fullName() != null && !body.fullName().isBlank()) {
            user.setFullName(body.fullName().trim());
        }
        if (body.password() != null && !body.password().isBlank()) {
            if (body.password().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пароль не короче 6 символов");
            }
            user.setPasswordHash(passwordEncoder.encode(body.password()));
        }
        if (body.active() != null) {
            if (user.isSuperAdmin() && Boolean.FALSE.equals(body.active())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нельзя отключить супер-админа");
            }
            if (user.getId().equals(actor.userId()) && Boolean.FALSE.equals(body.active())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нельзя отключить свою учётку");
            }
            user.setActive(body.active());
        }
        if (body.sections() != null) {
            if (user.isSuperAdmin()) {
                user.setSections(EnumSet.allOf(LkAdminSection.class));
            } else {
                Set<LkAdminSection> sections = LkAdminAuthService.parseSections(body.sections());
                if (sections.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Выберите хотя бы один раздел");
                }
                user.setSections(sections);
            }
        }
        repository.save(user);
        return toDto(user);
    }

    private LkAdminUserDto toDto(LkAdminUser user) {
        Set<LkAdminSection> sections = LkAdminAuthService.effectiveSections(user);
        return new LkAdminUserDto(
            user.getId().toString(),
            user.getUsername(),
            user.getFullName(),
            user.isActive(),
            user.isSuperAdmin(),
            sections.stream().map(Enum::name).sorted().collect(Collectors.toList()),
            user.getCreatedAt() == null ? "" : user.getCreatedAt().toString()
        );
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }
}
