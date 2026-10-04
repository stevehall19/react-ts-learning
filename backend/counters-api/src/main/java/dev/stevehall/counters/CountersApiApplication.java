package dev.stevehall.counters;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "Counters API", version = "v1"),
  servers = @Server(url = "/"))
public class CountersApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(CountersApiApplication.class, args);
  }

}
