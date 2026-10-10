package dev.stevehall.counters;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static dev.stevehall.counters.TestUsers.ALICE;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CounterController.class)
class CounterControllerTest {

  @MockitoBean
  CounterService counterService;

  @Autowired
  MockMvc mockMvc;

  @Test
  void listReturnsCountersFromService() throws Exception {
    when(counterService.findAll(ALICE)).thenReturn(List.of(
      new Counter("Ones", 1, 0, ALICE),
      new Counter("Tens", 10, 100, ALICE)));

    mockMvc.perform(get("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2))
      .andExpect(jsonPath("$[1].label").value("Tens"))
      .andExpect(jsonPath("$[1].count").value(100));
  }

  @Test
  void unknownIdReturns404ProblemDetail() throws Exception {
    var id = UUID.randomUUID();
    var expectedMessage = String.format("Counter %s not found", id);
    when(counterService.findById(id, ALICE)).thenThrow(new CounterNotFoundException(id));

    mockMvc.perform(get("/api/counters/" + id)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isNotFound())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.detail").value(expectedMessage));
  }

  @Test
  void createHappyPath() throws Exception {

    var label = "Sevens";
    var step = 7;
    var start = 0;
    var id = UUID.randomUUID();
    var counter = new Counter(label, step, start, ALICE);
    ReflectionTestUtils.setField(counter, "id", id);
    when(counterService.create(label, step, start, ALICE))
      .thenReturn(counter);

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
    {"label":"Sevens","step":7}
    """))
      .andExpect(status().isCreated())
      .andExpect(content().contentType("application/json"))
      .andExpect(header().string(HttpHeaders.LOCATION, endsWith("/api/counters/" + id)))
      .andExpect(jsonPath("$.step").value(7))
      .andExpect(jsonPath("$.count").value(0));

    verify(counterService).create(label, step, start, ALICE);
  }

  @Test
  void createValidationError() throws Exception {

    mockMvc.perform(post("/api/counters")
        .with(jwt().jwt(j -> j.subject(ALICE)))
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
    {"label":"","step":0}
    """))
      .andExpect(status().isBadRequest())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(jsonPath("$.errors.label").isNotEmpty())
      .andExpect(jsonPath("$.errors.step").isNotEmpty());

    verify(counterService, never()).create(any(), anyInt(), anyInt(), any());
  }

  @Test
  void unexpectedExceptionReturns500ProblemWithoutMessage() throws Exception {
    var id = UUID.randomUUID();
    when(counterService.findById(id, ALICE)).thenThrow(new RuntimeException("secret detail"));

    mockMvc.perform(get("/api/counters/" + id)
        .with(jwt().jwt(j -> j.subject(ALICE))))
      .andExpect(status().isInternalServerError())
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
      .andExpect(content().string(not(containsString("secret detail"))));
  }
}
