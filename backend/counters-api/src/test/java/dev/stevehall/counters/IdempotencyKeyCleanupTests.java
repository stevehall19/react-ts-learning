package dev.stevehall.counters;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.time.Duration;
import java.util.UUID;

import static dev.stevehall.counters.TestUsers.ALICE;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Import(TestcontainersConfiguration.class)
@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.flyway.clean-disabled=false")
class IdempotencyKeyCleanupTests {

  @Autowired
  JdbcClient jdbc;
  @Autowired
  IdempotencyKeyCleanup task;
  @Autowired
  Flyway flyway;
  @Autowired
  IdempotencyKeyRepository keyRepo;



  @BeforeEach
  void resetDatabase() {
    flyway.clean();
    flyway.migrate();
  }

  @Test
  void deletesOnlyExpiredKeys() {
    var expiredKey = UUID.randomUUID().toString();
    var freshKey = UUID.randomUUID().toString();
    jdbc.sql("""
    INSERT INTO idempotency_key (owner_id, idem_key, request_hash, status_code, response_body, created_at)
    VALUES (?, ?, ?, 200, '{}', NOW() - INTERVAL ? SECOND)""")
      .params(ALICE, expiredKey, "hash", Duration.ofHours(25).toSeconds())
      .update();
    jdbc.sql("""
    INSERT INTO idempotency_key (owner_id, idem_key, request_hash, status_code, response_body, created_at)
    VALUES (?, ?, ?, 200, '{}', NOW())""")
      .params(ALICE, freshKey, "hash")
      .update();
    task.cleanupOldKeys();

    assertTrue(keyRepo.find(expiredKey, ALICE).isEmpty());
    assertTrue(keyRepo.find(freshKey, ALICE).isPresent());
  }
}
