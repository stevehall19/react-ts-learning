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

import static org.hamcrest.Matchers.contains;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
    mockMvc.perform(get("/api/counters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(4))
      .andExpect(jsonPath("$[*].label").value(contains("Ones", "Threes", "Fives", "Tens")));
  }

  @Test
  void createIncrementTwiceThenGet() throws Exception {

    var step = 7;
    var result = mockMvc.perform(post("/api/counters")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
    {"label":"Sevens","step":%d}
    """.formatted(step)))
      .andExpect(status().isCreated())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String generatedId = JsonPath.read(responseBody, "$.id");

    mockMvc.perform(post("/api/counters/" + generatedId +"/increment"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step));

    mockMvc.perform(post("/api/counters/" + generatedId +"/increment"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step*2));

    mockMvc.perform(get("/api/counters/" + generatedId))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.count").value(step*2));
  }

  @Test
  void deleteThenVerify404() throws Exception {
    var result = mockMvc.perform(get("/api/counters"))
      .andExpect(status().isOk())
      .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    String id = JsonPath.read(responseBody, "$[0].id");

    mockMvc.perform(delete("/api/counters/" + id))
      .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/counters/" + id))
      .andExpect(status().isNotFound())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void databaseRejectsZeroStepWhenValidationIsBypassed() {

    assertThrows(DataIntegrityViolationException.class, () -> {
      counterService.create("Bad", 0, 0);
    });
    assertEquals(4, counterRepository.count());
  }
}
