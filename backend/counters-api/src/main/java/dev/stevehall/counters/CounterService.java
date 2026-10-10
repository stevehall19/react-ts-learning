package dev.stevehall.counters;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CounterService {

  private final CounterRepository counterRepository;

  public CounterService(CounterRepository counterRepository) {
    this.counterRepository = counterRepository;
  }

  @Transactional(readOnly = true)
  public List<Counter> findAll(String ownerId) {
    return counterRepository.findAllByOwnerIdOrderByCreatedAtAsc(ownerId);
  }

  @Transactional(readOnly = true)
  public Counter findById(UUID uuid, String ownerId) {
    return counterRepository.findByIdAndOwnerId(uuid, ownerId).orElseThrow(() -> new CounterNotFoundException(uuid));
  }

  @Transactional
  public Counter create(String label, int step, int start, String ownerId) {
    return counterRepository.save(new Counter(label, step, start, ownerId));
  }

  @Transactional
  public Counter increment(UUID id, String ownerId) {
    var counter = findForUpdate(id, ownerId);
    counter.increment();
    return counter;
  }

  @Transactional
  public Counter reset(UUID id, String ownerId) {
    var counter = findForUpdate(id, ownerId);
    counter.reset();
    return counter;
  }

  @Transactional
  public void delete(UUID id, String ownerId) {
    var counter = findById(id, ownerId);
    counterRepository.delete(counter);
  }

  private Counter findForUpdate(UUID id, String ownerId) {
    return counterRepository.findByIdForUpdate(id, ownerId).orElseThrow(() -> new CounterNotFoundException(id));
  }
}
