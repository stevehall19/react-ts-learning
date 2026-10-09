package dev.stevehall.counters;

import com.jayway.jsonpath.JsonPath;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static dev.stevehall.counters.TestUsers.ALICE;
import static dev.stevehall.counters.TestUsers.BOB;
import static org.hamcrest.Matchers.contains;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.flyway.clean-disabled=false")
class CounterApiIntegrationTests {

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
  void verifyAllCountersOrderedByCreatedDate() throws Exception {
    mockMvc.perform(get("/api/counters").with(jwt()))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(4))
      .andExpect(jsonPath("$[*].label").value(contains("Ones", "Threes", "Fives", "Tens")));
  }

  @Test
  void usersCantReadOtherUsersCounters() throws Exception {

    var step = 7;
    var result = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
    {"label":"Sevens","step":%d}
    """.formatted(step)))
      .andExpect(status().isCreated())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String generatedId = JsonPath.read(responseBody, "$.id");

    mockMvc.perform(get("/api/counters/" + generatedId)
        .with(jwt().jwt(j -> j.subject(BOB))))
      .andExpect(status().isNotFound());
  }

  @Test
  void createIncrementTwiceThenGet() throws Exception {

    var step = 7;
    var result = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
    {"label":"Sevens","step":%d}
    """.formatted(step)))
      .andExpect(status().isCreated())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String generatedId = JsonPath.read(responseBody, "$.id");

    mockMvc.perform(post("/api/counters/" + generatedId +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    mockMvc.perform(post("/api/counters/" + generatedId +"/increment")
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step*2));

    mockMvc.perform(get("/api/counters/" + generatedId)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step*2));
  }

  @Test
  void incrementPastMaxIntReturns422AndKeepsCount() throws Exception {
    var step = Integer.MAX_VALUE;
    var start = 10;
    var result = mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
        {"label":"Overflow Test","step":%d, "start": %d}
        """.formatted(step, start)))
      .andExpect(status().isCreated())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String generatedId = JsonPath.read(responseBody, "$.id");

    mockMvc.perform(post("/api/counters/" + generatedId + "/increment")
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isUnprocessableContent())
      .andExpect(jsonPath("$.detail").value("New count would exceed max of " + Integer.MAX_VALUE))
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    mockMvc.perform(get("/api/counters/" + generatedId)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(start));
  }

  @Test
  void concurrentIncrementsAreNotLost() throws Exception {
    var step = 7;
    var increments = 20;
    UUID id = counterService.create("Sevens", step, 0, ALICE).getId();

    List<Callable<Counter>> tasks =
      Collections.nCopies(increments, () -> counterService.increment(id));

    try (ExecutorService executor = Executors.newFixedThreadPool(10)) {
      for (Future<Counter> result : executor.invokeAll(tasks)) {
        result.get();
      }
    }

    assertEquals(increments * step, counterService.findById(id).getCount());
  }

  @Test
  void deleteThenVerify404() throws Exception {
    var result = mockMvc.perform(get("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String id = JsonPath.read(responseBody, "$[0].id");

    mockMvc.perform(delete("/api/counters/" + id)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/counters/" + id)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isNotFound())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void databaseRejectsZeroStepWhenValidationIsBypassed() {

    assertThrows(DataIntegrityViolationException.class, () -> {
      counterService.create("Bad", 0, 0, ALICE);
    });
    assertEquals(4, counterRepository.count());
  }
}
