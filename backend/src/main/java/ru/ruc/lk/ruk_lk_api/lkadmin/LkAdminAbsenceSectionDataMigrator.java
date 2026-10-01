package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Бывший раздел {@code ABSENCE_REPORT} → Казань + Краснодар (голова отдельно, не выдаём автоматом).
 * Снимает CHECK до обновления enum-ограничения в {@link LkAdminSectionConstraintMigrator}.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LkAdminAbsenceSectionDataMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LkAdminAbsenceSectionDataMigrator.class);

    private static final String TABLE = "lk_admin_user_section";
    private static final String OLD = "ABSENCE_REPORT";
    private static final List<String> REPLACEMENTS = List.of(
        "ABSENCE_REPORT_KAZAN",
        "ABSENCE_REPORT_KRASNODAR"
    );

    private final JdbcTemplate jdbc;

    public LkAdminAbsenceSectionDataMigrator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgreSql() || !tableExists()) {
            return;
        }
        Integer oldCount = jdbc.queryForObject(
            "SELECT COUNT(*) FROM " + TABLE + " WHERE section = ?",
            Integer.class,
            OLD
        );
        if (oldCount == null || oldCount == 0) {
            return;
        }

        dropSectionChecks();

        List<String> userIds = jdbc.query(
            "SELECT DISTINCT user_id::text FROM " + TABLE + " WHERE section = ?",
            (rs, rowNum) -> rs.getString(1),
            OLD
        );
        int inserted = 0;
        for (String userId : userIds) {
            for (String next : REPLACEMENTS) {
                Integer exists = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM " + TABLE + " WHERE user_id = ?::uuid AND section = ?",
                    Integer.class,
                    userId,
                    next
                );
                if (exists != null && exists > 0) {
                    continue;
                }
                jdbc.update(
                    "INSERT INTO " + TABLE + " (user_id, section) VALUES (?::uuid, ?)",
                    userId,
                    next
                );
                inserted++;
            }
        }
        int deleted = jdbc.update("DELETE FROM " + TABLE + " WHERE section = ?", OLD);
        log.info(
            "Миграция разделов отчёта отсутствующих: users={}, inserted={}, deletedOld={}",
            userIds.size(),
            inserted,
            deleted
        );
    }

    private void dropSectionChecks() {
        List<String> names = jdbc.query(
            """
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.contype = 'c'
              AND t.relname = ?
              AND n.nspname = current_schema()
              AND pg_get_constraintdef(c.oid) ILIKE '%section%'
            """,
            (rs, rowNum) -> rs.getString(1),
            TABLE
        );
        for (String name : names) {
            jdbc.execute("ALTER TABLE " + TABLE + " DROP CONSTRAINT IF EXISTS \""
                + name.replace("\"", "\"\"") + "\"");
            log.info("Снят CHECK {} перед миграцией ABSENCE_REPORT", name);
        }
    }

    private boolean isPostgreSql() {
        if (jdbc.getDataSource() == null) {
            return false;
        }
        try (var connection = jdbc.getDataSource().getConnection()) {
            String product = connection.getMetaData().getDatabaseProductName();
            return product != null && product.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.warn("Не удалось определить СУБД: {}", e.getMessage());
            return false;
        }
    }

    private boolean tableExists() {
        Integer count = jdbc.queryForObject(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = ?
            """,
            Integer.class,
            TABLE
        );
        return count != null && count > 0;
    }
}
