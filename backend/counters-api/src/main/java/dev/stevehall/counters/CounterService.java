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
  public List<Counter> findAll() {
    return counterRepository.findAllByOrderByCreatedAtAsc();
  }

  @Transactional(readOnly = true)
  public Counter findById(UUID uuid) {
    return counterRepository.findById(uuid).orElseThrow(() -> new CounterNotFoundException(uuid));
  }

  @Transactional
  public Counter create(String label, int step, int start) {
    return counterRepository.save(new Counter(label, step, start));
  }

  @Transactional
  public Counter increment(UUID id) {
    var counter = findById(id);
    counter.increment();
    return counter;
  }

  @Transactional
  public Counter reset(UUID id) {
   var counter = findById(id);
   counter.reset();
   return counter;
  }

  @Transactional
  public void delete(UUID id) {
    var counter = findById(id);
    counterRepository.delete(counter);
  }
}
