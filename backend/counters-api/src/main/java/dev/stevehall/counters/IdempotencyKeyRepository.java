package dev.stevehall.counters;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;

@Repository
public class IdempotencyKeyRepository {

  private final JdbcClient jdbc;

  public IdempotencyKeyRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  void claim(String key, String requestHash) {
    jdbc.sql("INSERT INTO idempotency_key (idem_key, request_hash) VALUES (?, ?)")
      .params(key, requestHash)
      .update();
  }

  void saveResponse(String key, int statusCode, String location, String body) {
    jdbc.sql("""
          UPDATE idempotency_key
          SET status_code = ?, location = ?, response_body = ?
          WHERE idem_key = ?""")
      .params(statusCode, location, body, key)
      .update();
  }

  Optional<StoredResponse> find(String key) {
    return jdbc.sql("""
        SELECT request_hash, status_code, location, response_body
        FROM idempotency_key WHERE idem_key = ?""")
      .param(key)
      .query(StoredResponse.class)
      .optional();
  }

  int deleteOlderThan(Duration age) {
    return jdbc.sql("""
          DELETE FROM idempotency_key
          WHERE created_at < NOW() - INTERVAL ? SECOND""")
      .param(age.toSeconds())
      .update();
  }
}
