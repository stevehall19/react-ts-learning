package dev.stevehall.counters;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
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

  @PostMapping
  public ResponseEntity<CounterResponse> createCounter(@Valid @RequestBody CreateCounterRequest request) {
    var response = CounterResponse.from(counterService
      .create(request.label(), request.step(), request.start()));
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
      .path("/{id}")
      .buildAndExpand(response.id())
      .toUri();
    return ResponseEntity.created(location).body(response);
  }

  @PostMapping("{id}/increment")
  public CounterResponse incrementCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService
      .increment(id));

  }

  @PostMapping("{id}/reset")
  public CounterResponse resetCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService
      .reset(id));
  }

  @DeleteMapping("{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCounter(@PathVariable UUID id) {
    counterService.delete(id);
  }
}
