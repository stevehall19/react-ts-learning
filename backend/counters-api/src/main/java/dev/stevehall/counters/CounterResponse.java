package dev.stevehall.counters;

import java.util.UUID;

public record CounterResponse(UUID id, String label, int step, int start, int count) {

  static CounterResponse from(Counter c) {
    return new CounterResponse(c.getId(), c.getLabel(), c.getStep(), c.getStart(), c.getCount());
  }
}
