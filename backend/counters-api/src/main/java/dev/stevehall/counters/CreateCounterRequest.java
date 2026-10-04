package dev.stevehall.counters;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;



public record CreateCounterRequest(@NotBlank @Size(max = 100) String label, @NotNull @Min(1) Integer step, Integer start) {
  public CreateCounterRequest {
    if (start == null) {
      start = 0;
    }
  }
}
