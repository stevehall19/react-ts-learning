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

  void claim(String key, String requestHash, String ownerId) {
    jdbc.sql("INSERT INTO idempotency_key (idem_key, request_hash, owner_id) VALUES (?, ?, ?)")
      .params(key, requestHash, ownerId)
      .update();
  }

  void saveResponse(String key, int statusCode, String location, String body, String ownerId) {
    jdbc.sql("""
          UPDATE idempotency_key
          SET status_code = ?, location = ?, response_body = ?
          WHERE idem_key = ? AND owner_id = ?""")
      .params(statusCode, location, body, key, ownerId)
      .update();
  }

  Optional<StoredResponse> find(String key, String ownerId) {
    return jdbc.sql("""
        SELECT request_hash, status_code, location, response_body
        FROM idempotency_key WHERE idem_key = ? AND owner_id = ?""")
      .params(key, ownerId)
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
