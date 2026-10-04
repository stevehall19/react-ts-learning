package dev.stevehall.counters;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CounterService {

  private final CounterRepository counterRepository;

  public CounterService(CounterRepository counterRepository) {
    this.counterRepository = counterRepository;
  }

  public List<Counter> findAll() {
    return counterRepository.findAllByOrderByCreatedAtAsc();
  }

  public Counter findById(UUID uuid) {
    return counterRepository.findById(uuid).orElseThrow(() -> new CounterNotFoundException(uuid));
  }
}
