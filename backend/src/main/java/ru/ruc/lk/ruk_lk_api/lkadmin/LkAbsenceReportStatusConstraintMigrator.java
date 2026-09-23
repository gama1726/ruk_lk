package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate {@code ddl-auto=update} не обновляет PostgreSQL CHECK на {@code @Enumerated(STRING)}.
 * После добавления {@link LkAbsenceReportStatus#CANCELLED} старый CHECK роняет отмену отчёта.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class LkAbsenceReportStatusConstraintMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LkAbsenceReportStatusConstraintMigrator.class);

    private static final String TABLE = "lk_absence_report";
    private static final String COLUMN = "status";
    private static final String CONSTRAINT = "lk_absence_report_status_check";

    private final JdbcTemplate jdbc;

    public LkAbsenceReportStatusConstraintMigrator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgreSql()) {
            return;
        }
        if (!tableExists()) {
            log.debug("Таблица {} ещё нет — пропускаем миграцию CHECK", TABLE);
            return;
        }

        String allowed = Arrays.stream(LkAbsenceReportStatus.values())
            .map(Enum::name)
            .map(v -> "'" + v.replace("'", "''") + "'")
            .collect(Collectors.joining(", "));

        String desiredDef = "CHECK (((status)::text = ANY ((ARRAY[" + allowed + "])::text[])))";

        List<String> existingDefs = jdbc.query(
            """
            SELECT pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.contype = 'c'
              AND t.relname = ?
              AND n.nspname = current_schema()
              AND pg_get_constraintdef(c.oid) ILIKE ?
            """,
            (rs, rowNum) -> rs.getString(1),
            TABLE,
            "%" + COLUMN + "%"
        );

        boolean alreadyOk = existingDefs.stream().anyMatch(def ->
            def != null && normalizeCheckDef(def).equals(normalizeCheckDef(desiredDef))
        );
        if (alreadyOk) {
            return;
        }

        for (String name : findStatusCheckNames()) {
            jdbc.execute("ALTER TABLE " + TABLE + " DROP CONSTRAINT IF EXISTS " + quoteIdent(name));
            log.info("Снят устаревший CHECK {} на {}.{}", name, TABLE, COLUMN);
        }

        jdbc.execute(
            "ALTER TABLE " + TABLE
                + " ADD CONSTRAINT " + quoteIdent(CONSTRAINT)
                + " CHECK ((" + COLUMN + ")::text = ANY (ARRAY[" + allowed + "]::text[]))"
        );
        log.info("Обновлён CHECK {} для {}.{}: {}", CONSTRAINT, TABLE, COLUMN, allowed);
    }

    private boolean isPostgreSql() {
        if (jdbc.getDataSource() == null) {
            return false;
        }
        try (var connection = jdbc.getDataSource().getConnection()) {
            String product = connection.getMetaData().getDatabaseProductName();
            return product != null && product.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.warn("Не удалось определить СУБД для миграции CHECK status: {}", e.getMessage());
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

    private List<String> findStatusCheckNames() {
        return jdbc.query(
            """
            SELECT c.conname
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.contype = 'c'
              AND t.relname = ?
              AND n.nspname = current_schema()
              AND pg_get_constraintdef(c.oid) ILIKE ?
            """,
            (rs, rowNum) -> rs.getString(1),
            TABLE,
            "%" + COLUMN + "%"
        );
    }

    private static String normalizeCheckDef(String def) {
        return def.replaceAll("\\s+", " ").trim().toLowerCase();
    }

    private static String quoteIdent(String name) {
        return "\"" + name.replace("\"", "\"\"") + "\"";
    }
}
