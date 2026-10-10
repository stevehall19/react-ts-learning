package dev.stevehall.counters;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Optional;

@Aspect
@Component
public class IdempotencyAspect {

  static final String HEADER = "Idempotency-Key";

  private final IdempotencyKeyRepository keyRepo;
  private final TransactionTemplate tx;
  private final ObjectMapper objectMapper;

  public IdempotencyAspect(IdempotencyKeyRepository keyRepo, TransactionTemplate tx, ObjectMapper objectMapper) {
    this.keyRepo = keyRepo;
    this.tx = tx;
    this.objectMapper = objectMapper;
  }

  @Around("@annotation(Idempotent)")
  public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
    HttpServletRequest request =
      ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    String key = request.getHeader(HEADER);
    if (key == null) {
      return joinPoint.proceed();
    }
    if (key.isBlank() || key.length() > 64) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, HEADER + " must be 1 to 64 characters");
    }
    String hash = requestHash(request, joinPoint.getArgs());
    String ownerId = currentOwnerId();

    try {
      return execute(joinPoint, key, hash, ownerId);
    } catch (DuplicateKeyException e) {
      return replay(key, hash, ownerId);
    } catch (CannotAcquireLockException e) {
      //The request holding this key rolled back while others waited on it, and the waiters deadlocked on the INSERT.
      // Tell the client to retry instead of retrying here, which can repeat as many times as there are waiters.
      throw new IdempotentRequestInProgressException(key);
    }
  }

  // One transaction: claim the key, run the handler, store the response.
  // A concurrent request with the same key blocks on the INSERT until this commits.
  private ResponseEntity<?> execute(ProceedingJoinPoint joinPoint, String key, String hash, String ownerId) {
    return tx.execute(status -> {
      keyRepo.claim(key, hash, ownerId);
      ResponseEntity<?> response = proceed(joinPoint);
      keyRepo.saveResponse(key, response.getStatusCode().value(),
        response.getHeaders().getFirst(HttpHeaders.LOCATION),
        objectMapper.writeValueAsString(response.getBody()), ownerId);
      return response;
    });
  }

  private ResponseEntity<String> replay(String key, String hash, String ownerId) {
    Optional<StoredResponse> storedOptional = keyRepo.find(key, ownerId);

    var stored = storedOptional.orElseThrow(() -> new IllegalStateException("Key not found: " + key));
    if (!stored.requestHash().equals(hash)) {
      throw new IdempotencyKeyReusedException(key);
    }
    var builder = ResponseEntity.status(stored.statusCode())
      .contentType(MediaType.APPLICATION_JSON)
      .header("Idempotent-Replayed", "true");
    if (stored.location() != null) {
      builder.header(HttpHeaders.LOCATION, stored.location());
    }
    return builder.body(stored.responseBody());
  }

  private static ResponseEntity<?> proceed(ProceedingJoinPoint joinPoint) {
    try {
      return (ResponseEntity<?>) joinPoint.proceed();
    } catch (RuntimeException | Error e) {
      throw e;
    } catch (Throwable e) {
      throw new IllegalStateException(e);
    }
  }

  private String requestHash(HttpServletRequest request, Object[] args) {
    // The caller's token isn't part of the request: a retry with a refreshed token is the same request.
    var requestArgs = Arrays.stream(args).filter(arg -> !(arg instanceof Jwt)).toList();
    var input = request.getMethod() + " " + request.getRequestURI() + " " + objectMapper.writeValueAsString(requestArgs);
    try {
      var digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private static String currentOwnerId() {
    if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken token) {
      return token.getToken().getSubject();
    }
    throw new IllegalStateException("@Idempotent endpoints need a JWT-authenticated request");
  }
}
