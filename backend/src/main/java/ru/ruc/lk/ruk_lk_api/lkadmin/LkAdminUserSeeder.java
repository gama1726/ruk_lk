package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.EnumSet;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class LkAdminUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LkAdminUserSeeder.class);

    private final LkAdminUserRepository repository;
    private final LkAdminProperties properties;
    private final PasswordEncoder passwordEncoder;

    public LkAdminUserSeeder(
        LkAdminUserRepository repository,
        LkAdminProperties properties,
        PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        String username = properties.username() == null ? "" : properties.username().trim();
        String password = properties.password() == null ? "" : properties.password();
        String fullName = properties.fullName() == null || properties.fullName().isBlank()
            ? "Супер-администратор ЛК"
            : properties.fullName().trim();

        if (username.isBlank() || password.isBlank()) {
            log.warn("LK admin seed skipped: задайте app.lk-admin.username и app.lk-admin.password");
            return;
        }

        var byRole = repository.findFirstBySuperAdminTrue();
        if (byRole.isPresent()) {
            LkAdminUser user = byRole.get();
            boolean changed = false;
            if (!user.getUsername().equalsIgnoreCase(username)
                && repository.findByUsernameIgnoreCase(username).filter(u -> !u.getId().equals(user.getId())).isEmpty()) {
                user.setUsername(username.toLowerCase(Locale.ROOT));
                changed = true;
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(password));
                changed = true;
            }
            if (!fullName.equals(user.getFullName())) {
                user.setFullName(fullName);
                changed = true;
            }
            user.setSections(EnumSet.allOf(LkAdminSection.class));
            user.setActive(true);
            repository.save(user);
            if (changed) {
                log.info("Обновлён супер-админ ЛК ({})", user.getUsername());
            }
            return;
        }

        if (repository.findByUsernameIgnoreCase(username).isPresent()) {
            log.warn("LK admin seed skipped: логин '{}' уже занят не-супер-админом", username);
            return;
        }

        LkAdminUser user = new LkAdminUser(
            UUID.randomUUID(),
            username.toLowerCase(Locale.ROOT),
            passwordEncoder.encode(password),
            fullName,
            true,
            EnumSet.allOf(LkAdminSection.class)
        );
        repository.save(user);
        log.info("Создан супер-админ ЛК ({})", username);
    }
}
