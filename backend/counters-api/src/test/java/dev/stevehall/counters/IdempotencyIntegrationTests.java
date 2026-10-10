package dev.stevehall.counters;

import com.jayway.jsonpath.JsonPath;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static dev.stevehall.counters.TestUsers.ALICE;
import static dev.stevehall.counters.TestUsers.BOB;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.flyway.clean-disabled=false")
class IdempotencyIntegrationTests {

  @Autowired
  CounterService counterService;

  @Autowired
  CounterRepository counterRepository;

  @Autowired
  MockMvc mockMvc;

  @Autowired
  Flyway flyway;

  @BeforeEach
  void resetDatabase() {
    flyway.clean();
    flyway.migrate();
  }

  @Test
  void concurrentFailedRequestIsNotFoundOrInProgress() throws Exception {

    var increments = 30;
    var key = UUID.randomUUID().toString();
    var id = UUID.randomUUID().toString();

    List<Callable<Integer>> tasks = Collections.nCopies(increments, () ->
      mockMvc.perform(post("/api/counters/" + id + "/increment")
          .with(jwt())
          .header("Idempotency-Key", key))
        .andReturn().getResponse().getStatus());

    List<Integer> statuses = new ArrayList<>();
    try (ExecutorService executor = Executors.newFixedThreadPool(increments)) {
      for (Future<Integer> result : executor.invokeAll(tasks)) {
        statuses.add(result.get());
      }
    }

    assertThat(statuses, everyItem(oneOf(404, 409)));
    assertThat(statuses, hasItem(404));
  }

  @Test
  void failedRequestDoesNotUseUpTheKey() throws Exception {
    var key = UUID.randomUUID().toString();
    var missingId = UUID.randomUUID().toString();

    mockMvc.perform(post("/api/counters/" + missingId +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .header("Idempotency-Key", key))
      .andExpect(status().isNotFound())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    var counterId = counterService.create("Sevens", 7, 0, ALICE).getId();
    mockMvc.perform(post("/api/counters/" + counterId + "/increment")
        .header("Idempotency-Key", key)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(7));
  }

  @Test
  void retriedCreateReturnsTheSameCounter() throws Exception {
    var key = UUID.randomUUID().toString();
    var body = """
      {"label":"Sevens","step":7}
      """;

    var first = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated())
      .andReturn();

    String firstId = JsonPath.read(first.getResponse().getContentAsString(), "$.id");
    String firstLocation = first.getResponse().getHeader("Location");

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated())
      .andExpect(header().string("Location", firstLocation))
      .andExpect(jsonPath("$.id").value(firstId));

    assertEquals(5, counterRepository.count());
  }

  @Test
  void reusedKeyWithDifferentBodyIsRejected() throws Exception {
    var key = UUID.randomUUID().toString();
    var body = """
      {"label":"Sevens","step":7}
      """;
    var body2 = """
      {"label":"Sevens","step":8}
      """;

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated());

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body2))
      .andExpect(status().isUnprocessableContent())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void retriedKeyBySameUserWithRefreshedTokenIsAccepted() throws Exception {

    var key = UUID.randomUUID().toString();
    var step = 7;
    var id = counterService.create("Sevens", step, 0, ALICE).getId();

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .header("Idempotency-Key", key))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE).tokenValue(UUID.randomUUID().toString())))
        .header("Idempotency-Key", key))
      .andExpect(status().isOk())
      .andExpect(header().string("Idempotent-Replayed", "true"))
      .andExpect(jsonPath("$.count").value(step));

    assertEquals(step, counterService.findById(id, ALICE).getCount());
  }

  @Test
  void usersWithSameKeysGetTheirOwnResults() throws Exception {

    var key = UUID.randomUUID().toString();
    var body = """
      {"label":"Sevens","step":7}
      """;

    var first = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated())
      .andReturn();

    String firstId = JsonPath.read(first.getResponse().getContentAsString(), "$.id");

    var second = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(BOB)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated())
      .andExpect(header().doesNotExist("Idempotent-Replayed"))
      .andReturn();

    String secondId = JsonPath.read(second.getResponse().getContentAsString(), "$.id");
    assertNotEquals(firstId, secondId);

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(BOB)))
        .contentType(MediaType.APPLICATION_JSON)
        .header("Idempotency-Key", key)
        .content(body))
      .andExpect(status().isCreated())
      .andExpect(header().string("Idempotent-Replayed", "true"))
      .andExpect(jsonPath("$.id").value(secondId));
  }

  @Test
  void retriedKeyByDifferentUserIsNotFound() throws Exception {

    var key = UUID.randomUUID().toString();
    var step = 7;
    var id = counterService.create("Sevens", step, 0, ALICE).getId();

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .header("Idempotency-Key", key))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(BOB)))
        .header("Idempotency-Key", key))
      .andExpect(status().isNotFound())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    assertEquals(step, counterService.findById(id, ALICE).getCount());
  }

  @Test
  void retriedIncrementCountsOnce() throws Exception {

    var key = UUID.randomUUID().toString();
    var step = 7;
    var id = counterService.create("Sevens", step, 0, ALICE).getId();

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .header("Idempotency-Key", key))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    mockMvc.perform(post("/api/counters/" + id +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .header("Idempotency-Key", key))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    assertEquals(step, counterService.findById(id, ALICE).getCount());
  }

  @Test
  void concurrentRetriesCountOnce() throws Exception {

    var key = UUID.randomUUID().toString();
    var increments = 10;
    var step = 7;
    var id = counterService.create("Sevens", step, 0, ALICE).getId();

    List<Callable<ResultActions>> tasks =
      Collections.nCopies(increments, () -> mockMvc.perform(post("/api/counters/" + id +"/increment")
          .header("Idempotency-Key", key)
          .with(jwt().jwt(j -> j.subject(ALICE))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(step)));

    try (ExecutorService executor = Executors.newFixedThreadPool(10)) {
      for (Future<ResultActions> result : executor.invokeAll(tasks)) {
        result.get();
      }
    }

    assertEquals(step, counterService.findById(id, ALICE).getCount());
  }
}
