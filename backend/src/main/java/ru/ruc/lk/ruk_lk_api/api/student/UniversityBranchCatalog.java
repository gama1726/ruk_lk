package ru.ruc.lk.ruk_lk_api.api.student;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import ru.ruc.lk.ruk_lk_api.integration.onec.OneCProfileResponse;

/**
 * Справочник филиалов РУК — тот же, что плашка BranchBanner / {@code resolveUniversityBranch} на фронте.
 */
public final class UniversityBranchCatalog {

    public record Branch(String id, String label, String... keywords) {}

    public static final Branch MAIN = new Branch("main", "Голова");
    public static final Branch KAZAN = new Branch("kazan", "Казань", "казан");
    public static final Branch KRASNODAR = new Branch("krasnodar", "Краснодар", "краснодар");
    public static final Branch VLADIMIR = new Branch("vladimir", "Владимир", "владимир");
    public static final Branch ARZAMAS = new Branch("arzamas", "Арзамас", "арзамас");
    public static final Branch UFA = new Branch("ufa", "Уфа", "уфа", "башкир");
    public static final Branch VOLGOGRAD = new Branch("volgograd", "Волгоград", "волгоград");
    public static final Branch IZHEVSK = new Branch("izhevsk", "Ижевск", "ижевск", "удмурт");
    public static final Branch KALININGRAD = new Branch("kaliningrad", "Калининград", "калининград");
    public static final Branch PK = new Branch("pk", "Камчатка", "камчат", "петропавловск");
    public static final Branch CRIMEA = new Branch("crimea", "Крым", "крым", "симферополь", "совхозн");
    public static final Branch ENGELS = new Branch("engels", "Энгельс", "энгельс", "поволжск");
    public static final Branch SARANSK = new Branch("saransk", "Саранск", "саранск", "мордов");
    public static final Branch SMOLENSK = new Branch("smolensk", "Смоленск", "смоленск");
    public static final Branch CHEB = new Branch("cheb", "Чебоксары", "чебоксар", "чуваш");

    private static final List<Branch> ALL = List.of(
        MAIN, KAZAN, KRASNODAR, VLADIMIR, ARZAMAS, UFA, VOLGOGRAD, IZHEVSK,
        KALININGRAD, PK, CRIMEA, ENGELS, SARANSK, SMOLENSK, CHEB
    );

    private static final List<Branch> MATCHERS = List.of(
        KAZAN, KRASNODAR, VLADIMIR, ARZAMAS, UFA, VOLGOGRAD, IZHEVSK,
        KALININGRAD, PK, CRIMEA, ENGELS, SARANSK, SMOLENSK, CHEB
    );

    private UniversityBranchCatalog() {}

    public static List<Branch> all() {
        return ALL;
    }

    public static Optional<Branch> findById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        String key = id.trim().toLowerCase(Locale.ROOT);
        return ALL.stream().filter(b -> b.id().equals(key)).findFirst();
    }

    public static String labelOf(String id) {
        return findById(id).map(Branch::label).orElse(id == null || id.isBlank() ? "Не определён" : id);
    }

    /** Как на фронте: нет «филиал» в branch → голова; иначе по ключевым словам. */
    public static Branch resolveFromBranchLabel(String branchLabel) {
        String haystack = branchLabel == null ? "" : branchLabel.trim().toLowerCase(Locale.ROOT);
        if (haystack.isEmpty() || !haystack.contains("филиал")) {
            return MAIN;
        }
        for (Branch branch : MATCHERS) {
            for (String keyword : branch.keywords()) {
                if (haystack.contains(keyword)) {
                    return branch;
                }
            }
        }
        return MAIN;
    }

    public static Branch resolveFromProfile(OneCProfileResponse profile) {
        if (profile == null) {
            return MAIN;
        }
        String label = firstNonBlank(profile.branch(), profile.faculty(), profile.department());
        return resolveFromBranchLabel(label);
    }

    /** Старые значения enum аналитики → id справочника. */
    public static String migrateLegacyCampusId(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        String lower = value.toLowerCase(Locale.ROOT);
        if (findById(lower).isPresent()) {
            return lower;
        }
        return switch (value.toUpperCase(Locale.ROOT)) {
            case "KAZAN" -> KAZAN.id();
            case "KRASNODAR" -> KRASNODAR.id();
            case "HEAD" -> MAIN.id();
            case "OTHER" -> null; // нужен повторный разбор из 1С
            default -> null;
        };
    }

    public static boolean isKnownId(String id) {
        return findById(id).isPresent();
    }

    private static String firstNonBlank(String... parts) {
        return Arrays.stream(parts)
            .filter(p -> p != null && !p.isBlank())
            .findFirst()
            .orElse("");
    }
}
