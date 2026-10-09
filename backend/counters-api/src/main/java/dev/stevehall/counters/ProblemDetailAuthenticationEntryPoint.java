package dev.stevehall.counters;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;

@Component
public class ProblemDetailAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  private final BearerTokenAuthenticationEntryPoint originalEntryPoint;

  public ProblemDetailAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.originalEntryPoint = new BearerTokenAuthenticationEntryPoint();
  }

  @Override
  public void commence(HttpServletRequest request,
                       HttpServletResponse response,
                       AuthenticationException authException) throws IOException {
    originalEntryPoint.commence(request, response, authException);
    ProblemDetail problemDetail = ProblemDetail
      .forStatusAndDetail(HttpStatus.UNAUTHORIZED, "A valid bearer token is required");
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    problemDetail.setInstance(URI.create(request.getRequestURI()));
    objectMapper.writeValue(response.getOutputStream(), problemDetail);
  }
}
