package dev.stevehall.counters;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CounterRepository extends JpaRepository<Counter, UUID> {

  Optional<Counter> findByIdAndOwnerId(UUID id, String ownerId);

  List<Counter> findAllByOwnerIdOrderByCreatedAtAsc(String ownerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from Counter c where c.id = :id and c.ownerId = :ownerId")
  Optional<Counter> findByIdForUpdate(UUID id, String ownerId);
}
