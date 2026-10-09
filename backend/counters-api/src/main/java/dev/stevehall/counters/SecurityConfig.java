package dev.stevehall.counters;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

  private final ProblemDetailAuthenticationEntryPoint entryPoint;

  public SecurityConfig(ProblemDetailAuthenticationEntryPoint entryPoint) {
    this.entryPoint = entryPoint;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health/**").permitAll()
        // Off in the prod profile; open locally for Swagger UI.
        .requestMatchers("/v3/api-docs/**").permitAll()
        .requestMatchers("/swagger-ui/**").permitAll()
        .requestMatchers("/swagger-ui.html").permitAll()
        .anyRequest().authenticated()
      ).oauth2ResourceServer(
        oauth2 -> oauth2.jwt(Customizer.withDefaults()).authenticationEntryPoint(entryPoint))
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .csrf(AbstractHttpConfigurer::disable);

    return http.build();
  }
}
