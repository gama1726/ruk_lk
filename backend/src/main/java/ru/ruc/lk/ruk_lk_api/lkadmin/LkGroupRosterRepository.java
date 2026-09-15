package ru.ruc.lk.ruk_lk_api.lkadmin;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LkGroupRosterRepository extends JpaRepository<LkGroupRoster, String> {

    List<LkGroupRoster> findAllByOrderByGroupNameAsc();
}
