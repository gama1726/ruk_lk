package ru.ruc.lk.ruk_lk_api.events;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventDto;
import ru.ruc.lk.ruk_lk_api.events.dto.CampusEventWriteRequest;

@Service
public class EventService {

    private final CampusEventRepository repository;

    public EventService(CampusEventRepository repository) {
        this.repository = repository;
    }

    public List<CampusEventDto> listPublishedForMonth(int year, int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Месяц должен быть от 1 до 12");
        }
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        return repository.findPublishedOverlappingMonth(monthStart, monthEnd).stream()
            .map(EventService::toDto)
            .toList();
    }

    public List<CampusEventDto> listAllForAdmin() {
        return repository.findAllByOrderByStartDateAscTitleAsc().stream()
            .map(EventService::toDto)
            .toList();
    }

    public CampusEventDto create(CampusEventWriteRequest body) {
        ParsedWrite parsed = parseWrite(body, true);
        CampusEvent event = new CampusEvent(
            UUID.randomUUID(),
            parsed.title(),
            parsed.description(),
            parsed.startDate(),
            parsed.endDate(),
            parsed.published()
        );
        return toDto(repository.save(event));
    }

    public CampusEventDto update(UUID id, CampusEventWriteRequest body) {
        CampusEvent event = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Мероприятие не найдено"));
        ParsedWrite parsed = parseWrite(body, event.isPublished());
        event.setTitle(parsed.title());
        event.setDescription(parsed.description());
        event.setStartDate(parsed.startDate());
        event.setEndDate(parsed.endDate());
        event.setPublished(parsed.published());
        event.touch();
        return toDto(repository.save(event));
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Мероприятие не найдено");
        }
        repository.deleteById(id);
    }

    private static ParsedWrite parseWrite(CampusEventWriteRequest body, boolean defaultPublished) {
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Тело запроса обязательно");
        }
        String title = body.title() == null ? "" : body.title().trim();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите название");
        }
        if (title.length() > 300) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Название слишком длинное");
        }
        String description = body.description() == null ? null : body.description().trim();
        if (description != null && description.isEmpty()) {
            description = null;
        }
        if (description != null && description.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Описание слишком длинное");
        }
        LocalDate start = parseDate(body.startDate(), "startDate");
        LocalDate end = body.endDate() == null || body.endDate().isBlank()
            ? start
            : parseDate(body.endDate(), "endDate");
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Дата окончания не раньше даты начала");
        }
        boolean published = body.published() == null ? defaultPublished : body.published();
        return new ParsedWrite(title, description, start, end, published);
    }

    private static LocalDate parseDate(String raw, String field) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите " + field);
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректная дата " + field);
        }
    }

    static CampusEventDto toDto(CampusEvent event) {
        return new CampusEventDto(
            event.getId(),
            event.getTitle(),
            event.getDescription() == null ? "" : event.getDescription(),
            event.getStartDate().toString(),
            event.getEndDate().toString(),
            event.isPublished(),
            formatInstant(event.getCreatedAt()),
            formatInstant(event.getUpdatedAt())
        );
    }

    private static String formatInstant(Instant instant) {
        return instant == null ? "" : instant.toString();
    }

    private record ParsedWrite(
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        boolean published
    ) {}
}
