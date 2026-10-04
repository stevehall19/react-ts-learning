package dev.stevehall.counters;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "counter")
public class Counter {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  @Column
  private String label;
  @Column
  private int step;
  @Column
  private int start;
  @Column
  private int count;
  @Column(insertable = false, updatable = false)
  private Instant createdAt;

  protected Counter() {}

  public Counter(String label, int step, int start) {
    this.label = label;
    this.step = step;
    this.start = start;
    this.count = start;
  }
  public UUID getId() {
    return id;
  }

  public String getLabel() {
    return label;
  }

  public int getStep() {
    return step;
  }

  public int getStart() {
    return start;
  }

  public int getCount() {
    return count;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void reset() {
    this.count = start;
  }

  public void increment() {
    this.count = this.count + this.step;
  }
}
