package dev.stevehall.counters;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.flyway.clean-disabled=false")
class SecurityIntegrationTests {

  @Autowired
  MockMvc mockMvc;

  @Test
  void requestWithoutTokenGets401AskingForBearer() throws Exception {
    mockMvc.perform(get("/api/counters"))
      .andExpect(status().isUnauthorized())
      .andExpect(header().string("WWW-Authenticate", startsWith("Bearer")))
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void postWithoutTokenGets401NotCsrf403() throws Exception {
    var generatedId = UUID.randomUUID();

    mockMvc.perform(post("/api/counters/" + generatedId + "/increment"))
      .andExpect(status().isUnauthorized())
      .andExpect(header().string("WWW-Authenticate", startsWith("Bearer")))
      .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void healthIsReachableWithoutToken() throws Exception {
    mockMvc.perform(get("/actuator/health/readiness"))
      .andExpect(status().isOk());
  }
}
