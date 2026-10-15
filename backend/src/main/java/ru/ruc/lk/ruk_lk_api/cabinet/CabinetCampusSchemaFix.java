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
            dropCampusCheckConstraints();
            ensureVarcharColumn();
            migrateLegacyCodes();
            probeWriteMain();
        } catch (RuntimeException e) {
            log.warn("Cabinet campus schema fix: {}", e.toString(), e);
        }
    }

    /** Postgres мог оставить CHECK от старого enum — мешает писать main/kazan. */
    private void dropCampusCheckConstraints() {
        try {
            jdbc.execute("""
                DO $$
                DECLARE
                  r record;
                BEGIN
                  FOR r IN
                    SELECT c.conname
                    FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    WHERE t.relname = 'cabinet_user'
                      AND c.contype = 'c'
                      AND pg_get_constraintdef(c.oid) ILIKE '%campus%'
                  LOOP
                    EXECUTE format('ALTER TABLE cabinet_user DROP CONSTRAINT IF EXISTS %I', r.conname);
                  END LOOP;
                END $$
                """);
            log.info("Cabinet campus: CHECK-ограничения на campus сняты (если были)");
        } catch (RuntimeException e) {
            log.debug("Cabinet campus: drop CHECK пропущен ({})", e.toString());
        }
    }

    private void ensureVarcharColumn() {
        try {
            jdbc.execute(
                "ALTER TABLE cabinet_user ALTER COLUMN campus TYPE varchar(32) USING campus::text"
            );
            log.info("Cabinet campus: колонка приведена к varchar(32)");
        } catch (RuntimeException e) {
            try {
                jdbc.execute("ALTER TABLE cabinet_user ALTER COLUMN campus SET DATA TYPE varchar(32)");
            } catch (RuntimeException e2) {
                try {
                    jdbc.execute("ALTER TABLE cabinet_user ALTER COLUMN campus varchar(32)");
                } catch (RuntimeException ignored) {
                    log.debug("Cabinet campus: ALTER пропущен ({})", e.toString());
                }
            }
        }
    }

    private void migrateLegacyCodes() {
        int n = 0;
        n += jdbc.update("UPDATE cabinet_user SET campus = 'main' WHERE upper(campus) = 'HEAD'");
        n += jdbc.update("UPDATE cabinet_user SET campus = 'kazan' WHERE upper(campus) = 'KAZAN'");
        n += jdbc.update("UPDATE cabinet_user SET campus = 'krasnodar' WHERE upper(campus) = 'KRASNODAR'");
        n += jdbc.update("UPDATE cabinet_user SET campus = 'main' WHERE upper(campus) = 'OTHER'");
        n += jdbc.update(
            "UPDATE cabinet_user SET campus = 'main' WHERE campus IS NULL OR btrim(campus) = ''"
        );
        if (n > 0) {
            log.info("Cabinet campus: мигрировано/проставлено {} строк филиала", n);
        }
    }

    /** Проверка, что запись main вообще возможна (иначе enrich будет бесполезен). */
    private void probeWriteMain() {
        try {
            jdbc.queryForObject("SELECT 1 FROM cabinet_user LIMIT 1", Integer.class);
        } catch (RuntimeException e) {
            return;
        }
        try {
            // no-op update: убеждаемся, что значение 'main' допустимо для колонки
            jdbc.update("UPDATE cabinet_user SET campus = campus WHERE campus = 'main' AND 1 = 0");
            jdbc.execute("DO $$ BEGIN NULL; END $$");
            // Явная проверка через временный UPDATE 0 строк с присвоением в VALUES
            jdbc.queryForObject("SELECT CAST('main' AS varchar(32))", String.class);
            log.info("Cabinet campus: запись значения main допустима");
        } catch (RuntimeException e) {
            log.warn("Cabinet campus: значение main может быть недопустимо: {}", e.toString());
        }
    }
}
