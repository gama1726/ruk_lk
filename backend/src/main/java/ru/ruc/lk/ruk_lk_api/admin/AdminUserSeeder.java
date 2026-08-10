package ru.ruc.lk.ruk_lk_api.admin;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import ru.ruc.lk.ruk_lk_api.passphoto.EducationTrack;

@Component
@EnableConfigurationProperties(AdminProperties.class)
public class AdminUserSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

    private final AdminUserRepository repository;
    private final AdminProperties properties;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(
        AdminUserRepository repository,
        AdminProperties properties,
        PasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.properties = properties;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedOrUpdate(
            EducationTrack.SPO,
            properties.spo().username(),
            properties.spo().password()
        );
        seedOrUpdate(
            EducationTrack.HE,
            properties.he().username(),
            properties.he().password()
        );
    }

    private void seedOrUpdate(EducationTrack role, String rawUsername, String password) {
        String username = rawUsername == null ? "" : rawUsername.trim();
        if (username.isBlank() || password == null || password.isBlank()) {
            log.warn(
                "Admin seed skipped for {}: задайте app.admin.{}.username и .password",
                role,
                role == EducationTrack.SPO ? "spo" : "he"
            );
            return;
        }

        var existingByRole = repository.findByRole(role);
        if (existingByRole.isPresent()) {
            AdminUser user = existingByRole.get();
            boolean changed = false;
            if (!user.getUsername().equalsIgnoreCase(username)
                && repository.findByUsernameIgnoreCase(username).filter(u -> !u.getId().equals(user.getId())).isEmpty()) {
                user.setUsername(username);
                changed = true;
            }
            if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(password));
                changed = true;
            }
            if (changed) {
                repository.save(user);
                log.info("Обновлена учётка админа пропусков {} ({})", role, user.getUsername());
            }
            return;
        }

        if (repository.findByUsernameIgnoreCase(username).isPresent()) {
            log.warn("Admin seed skipped for {}: username '{}' уже занят", role, username);
            return;
        }
        AdminUser user = new AdminUser(
            UUID.randomUUID(),
            username,
            passwordEncoder.encode(password),
            role
        );
        repository.save(user);
        log.info("Создана учётка админа пропусков {} ({})", role, username);
    }
}
