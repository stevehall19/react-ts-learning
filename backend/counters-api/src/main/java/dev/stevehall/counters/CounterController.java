package dev.stevehall.counters;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/api/counters", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Counters")
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
  @ApiResponses(value = {
    @ApiResponse(responseCode = "404",
      description = "Counter not found",
      content = @Content(mediaType = "application/problem+json",
        schema = @Schema(implementation = Problem.class))),
    @ApiResponse(responseCode = "200", description = "The counter")})
  public CounterResponse getCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService.findById(id));
  }

  @PostMapping
  @ApiResponses(value = {
    @ApiResponse(responseCode = "201", description = "Counter created"),
    @ApiResponse(responseCode = "400", description = "Counter creation failed",
      content = @Content(mediaType = "application/problem+json",
      schema = @Schema(implementation = ValidationProblem.class)))})
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
  @ApiResponses(value = {
    @ApiResponse(responseCode = "404",
      description = "Counter not found",
      content = @Content(mediaType = "application/problem+json",
        schema = @Schema(implementation = Problem.class))),
    @ApiResponse(responseCode = "200", description = "The counter")})
  public CounterResponse incrementCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService
      .increment(id));

  }

  @PostMapping("{id}/reset")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "404",
      description = "Counter not found",
      content = @Content(mediaType = "application/problem+json",
        schema = @Schema(implementation = Problem.class))),
    @ApiResponse(responseCode = "200", description = "The counter")})
  public CounterResponse resetCounter(@PathVariable UUID id) {
    return CounterResponse.from(counterService
      .reset(id));
  }

  @DeleteMapping("{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @ApiResponses(value = {
    @ApiResponse(responseCode = "404",
      description = "Counter not found",
      content = @Content(mediaType = "application/problem+json",
        schema = @Schema(implementation = Problem.class))),
    @ApiResponse(responseCode = "204", description = "Counter deleted")})
  public void deleteCounter(@PathVariable UUID id) {
    counterService.delete(id);
  }
}
