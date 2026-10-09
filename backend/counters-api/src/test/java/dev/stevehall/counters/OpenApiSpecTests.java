package dev.stevehall.counters;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.flyway.clean-disabled=false")
class OpenApiSpecTests {

  @Autowired
  MockMvc mockMvc;

  @Test
  void committedSpecMatchesGeneratedSpec() throws Exception {
    String generated = mockMvc.perform(get("/v3/api-docs.yaml")
        .with(jwt()))
      .andExpect(status().isOk())
      .andReturn()
      .getResponse()
      .getContentAsString();

    Path file = specFile();

    if ("true".equals(System.getenv("UPDATE_OPENAPI"))) {
      Files.writeString(file, generated);
      fail("Wrote " + file + ". Re-run without UPDATE_OPENAPI to verify.");
    }

    assertTrue(Files.exists(file),
      "openapi.yaml is missing. Run once with UPDATE_OPENAPI=true to create it.");
    assertEquals(Files.readString(file), generated,
      "openapi.yaml is out of date. Re-run with UPDATE_OPENAPI=true, then review the diff.");
  }

  private static Path specFile() throws URISyntaxException {
    Path testClasses = Path.of(OpenApiSpecTests.class
      .getProtectionDomain().getCodeSource().getLocation().toURI()); // …/target/test-classes/
    return testClasses.getParent().getParent().resolve("openapi.yaml"); // …/counters-api/openapi.yaml
  }
}
