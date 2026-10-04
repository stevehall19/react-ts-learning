package dev.stevehall.counters;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CounterRepository extends JpaRepository<Counter, UUID> {
    List<Counter> findAllByOrderByCreatedAtAsc();
}
