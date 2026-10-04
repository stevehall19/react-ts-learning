package dev.stevehall.counters;

import org.springframework.boot.SpringApplication;

public class TestCountersApiApplication {

  public static void main(String[] args) {
    SpringApplication.from(CountersApiApplication::main).with(TestcontainersConfiguration.class).run(args);
  }

}
