package dev.stevehall.counters;

public class CounterOverflowException extends RuntimeException {

  public CounterOverflowException(String message, Throwable cause) {
    super(message, cause);
  }
}
