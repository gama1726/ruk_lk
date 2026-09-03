package ru.ruc.lk.ruk_lk_api.events;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampusEventRepository extends JpaRepository<CampusEvent, UUID> {

    List<CampusEvent> findAllByOrderByStartDateAscTitleAsc();

    List<CampusEvent> findByCampusOrderByStartDateAscTitleAsc(EventCampus campus);

    @Query("""
        select e from CampusEvent e
        where e.published = true
          and e.campus = :campus
          and e.startDate <= :monthEnd
          and e.endDate >= :monthStart
        order by e.startDate asc, e.title asc
        """)
    List<CampusEvent> findPublishedOverlappingMonth(
        @Param("campus") EventCampus campus,
        @Param("monthStart") LocalDate monthStart,
        @Param("monthEnd") LocalDate monthEnd
    );
}
