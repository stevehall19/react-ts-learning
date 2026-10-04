package dev.stevehall.counters;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/counters")
public class CounterController {

  private final CounterService counterService;

  public CounterController(CounterService counterService) {
    this.counterService = counterService;
  }

  @GetMapping
  public List<CounterResponse> getCounters() {
    return counterService.findAll().stream().map(CounterResponse::from).toList();
  }

  @GetMapping("{id}")
  public CounterResponse getCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService.findById(id));
  }
}
