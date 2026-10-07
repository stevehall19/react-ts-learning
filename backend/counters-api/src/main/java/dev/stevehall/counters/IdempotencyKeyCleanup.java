package dev.stevehall.counters;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class IdempotencyKeyCleanup {

  private static final Logger log = LoggerFactory.getLogger(IdempotencyKeyCleanup.class);

  private final IdempotencyKeyRepository keyRepo;

  public IdempotencyKeyCleanup(IdempotencyKeyRepository keyRepo) {
    this.keyRepo = keyRepo;
  }

  @Scheduled(fixedRateString = "PT1H")
  public void cleanupOldKeys() {
      var deleted = keyRepo.deleteOlderThan(Duration.ofHours(24));
      log.info("Deleted {} expired idempotency keys", deleted);
  }
}
