package ru.ruc.lk.ruk_lk_api.cabinet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * После смены campus с enum на string id (01.10.2026) гарантируем varchar-колонку
 * и мигрируем старые коды HEAD/KAZAN/… → main/kazan/… без участия Hibernate.
 */
@Component
@Order(40)
public class CabinetCampusSchemaFix implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CabinetCampusSchemaFix.class);

    private final JdbcTemplate jdbc;

    public CabinetCampusSchemaFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureVarcharColumn();
            migrateLegacyCodes();
        } catch (RuntimeException e) {
            log.warn("Cabinet campus schema fix: {}", e.toString());
        }
    }

    private void ensureVarcharColumn() {
        // PostgreSQL: если колонка — enum/другой тип, приводим к varchar(32).
        // H2 (dev): ALTER может отличаться — ошибки глотаем на уровне run().
        try {
            jdbc.execute(
                "ALTER TABLE cabinet_user ALTER COLUMN campus TYPE varchar(32) USING campus::text"
            );
            log.info("Cabinet campus: колонка приведена к varchar(32)");
        } catch (RuntimeException e) {
            // Уже varchar или не PostgreSQL — пробуем мягкий вариант H2/PG без USING
            try {
                jdbc.execute("ALTER TABLE cabinet_user ALTER COLUMN campus varchar(32)");
            } catch (RuntimeException ignored) {
                log.debug("Cabinet campus: ALTER пропущен ({})", e.toString());
            }
        }
    }

    private void migrateLegacyCodes() {
        int n = 0;
        n += jdbc.update("UPDATE cabinet_user SET campus = 'main' WHERE upper(campus) = 'HEAD'");
        n += jdbc.update("UPDATE cabinet_user SET campus = 'kazan' WHERE upper(campus) = 'KAZAN'");
        n += jdbc.update("UPDATE cabinet_user SET campus = 'krasnodar' WHERE upper(campus) = 'KRASNODAR'");
        n += jdbc.update("UPDATE cabinet_user SET campus = NULL WHERE upper(campus) = 'OTHER'");
        if (n > 0) {
            log.info("Cabinet campus: мигрировано {} строк со старыми кодами филиала", n);
        }
    }
}
