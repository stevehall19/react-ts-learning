package dev.stevehall.counters;

public class IdempotentRequestInProgressException extends RuntimeException {
  public IdempotentRequestInProgressException(String key) {
    super("A request with this key " + key + " is already being processed; retry it");
  }
}
