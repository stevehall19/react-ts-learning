package dev.stevehall.counters;

import java.util.UUID;

public class CounterNotFoundException extends RuntimeException {

  public CounterNotFoundException(UUID uuid) {
    super(String.format("Counter %s not found", uuid));
  }
}
