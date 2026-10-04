package dev.stevehall.counters;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

public record CounterResponse(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) UUID id,
                              @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String label,
                              @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int step,
                              @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int start,
                              @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int count) {

  static CounterResponse from(Counter c) {
    return new CounterResponse(c.getId(), c.getLabel(), c.getStep(), c.getStart(), c.getCount());
  }
}
